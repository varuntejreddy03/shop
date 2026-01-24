import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { Customer, Order, OrderItemRecord, OrderItem, CreateOrderInput } from "@shared/schema";

const DB_PATH = path.join(process.cwd(), "data", "orders.db");

function ensureDbDirectory() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    ensureDbDirectory();
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initSchema();
  }
  return db;
}

function initSchema() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      order_date TEXT NOT NULL,
      total_amount REAL NOT NULL DEFAULT 0,
      pdf_path TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      item_type TEXT NOT NULL,
      item_data TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
  `);

  console.log("[DB] SQLite database initialized successfully");
}

export interface IDatabase {
  createCustomer(name: string, phone: string): Customer;
  getCustomerById(id: number): Customer | undefined;
  findCustomerByPhone(phone: string): Customer | undefined;
  
  createOrder(input: CreateOrderInput): { order: Order; customer: Customer };
  getOrderById(id: number): Order | undefined;
  getOrderWithItems(id: number): { order: Order; customer: Customer; items: OrderItemRecord[] } | undefined;
  updateOrderPdfPath(orderId: number, pdfPath: string): void;
  
  getAllOrders(): Order[];
}

class SQLiteDatabase implements IDatabase {
  createCustomer(name: string, phone: string): Customer {
    const db = getDb();
    const stmt = db.prepare(
      "INSERT INTO customers (name, phone) VALUES (?, ?) RETURNING *"
    );
    const row = stmt.get(name, phone) as any;
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      createdAt: row.created_at,
    };
  }

  getCustomerById(id: number): Customer | undefined {
    const db = getDb();
    const stmt = db.prepare("SELECT * FROM customers WHERE id = ?");
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      createdAt: row.created_at,
    };
  }

  findCustomerByPhone(phone: string): Customer | undefined {
    const db = getDb();
    const stmt = db.prepare("SELECT * FROM customers WHERE phone = ?");
    const row = stmt.get(phone) as any;
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      createdAt: row.created_at,
    };
  }

  createOrder(input: CreateOrderInput): { order: Order; customer: Customer } {
    const db = getDb();

    let customer = this.findCustomerByPhone(input.phoneNumber);
    if (!customer) {
      customer = this.createCustomer(input.customerName, input.phoneNumber);
    }

    const totalAmount = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const orderStmt = db.prepare(
      "INSERT INTO orders (customer_id, order_date, total_amount) VALUES (?, ?, ?) RETURNING *"
    );
    const orderRow = orderStmt.get(customer.id, input.orderDate, totalAmount) as any;

    const itemStmt = db.prepare(
      "INSERT INTO order_items (order_id, item_type, item_data, quantity, price) VALUES (?, ?, ?, ?, ?)"
    );

    for (const item of input.items) {
      const { itemType, quantity, price, ...itemData } = item;
      itemStmt.run(orderRow.id, itemType, JSON.stringify(itemData), quantity, price);
    }

    console.log(`[DB] Order #${orderRow.id} created for customer ${customer.name}`);

    const order: Order = {
      id: orderRow.id,
      customerId: orderRow.customer_id,
      orderDate: orderRow.order_date,
      totalAmount: orderRow.total_amount,
      pdfPath: orderRow.pdf_path,
      createdAt: orderRow.created_at,
    };

    return { order, customer };
  }

  getOrderById(id: number): Order | undefined {
    const db = getDb();
    const stmt = db.prepare("SELECT * FROM orders WHERE id = ?");
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    return {
      id: row.id,
      customerId: row.customer_id,
      orderDate: row.order_date,
      totalAmount: row.total_amount,
      pdfPath: row.pdf_path,
      createdAt: row.created_at,
    };
  }

  getOrderWithItems(id: number): { order: Order; customer: Customer; items: OrderItemRecord[] } | undefined {
    const db = getDb();
    const order = this.getOrderById(id);
    if (!order) return undefined;

    const customer = this.getCustomerById(order.customerId);
    if (!customer) return undefined;

    const itemsStmt = db.prepare("SELECT * FROM order_items WHERE order_id = ?");
    const itemRows = itemsStmt.all(id) as any[];

    const items: OrderItemRecord[] = itemRows.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      itemType: row.item_type,
      itemData: row.item_data,
      quantity: row.quantity,
      price: row.price,
    }));

    return { order, customer, items };
  }

  updateOrderPdfPath(orderId: number, pdfPath: string): void {
    const db = getDb();
    const stmt = db.prepare("UPDATE orders SET pdf_path = ? WHERE id = ?");
    stmt.run(pdfPath, orderId);
    console.log(`[DB] Order #${orderId} PDF path updated to ${pdfPath}`);
  }

  getAllOrders(): Order[] {
    const db = getDb();
    const stmt = db.prepare("SELECT * FROM orders ORDER BY created_at DESC");
    const rows = stmt.all() as any[];
    return rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      orderDate: row.order_date,
      totalAmount: row.total_amount,
      pdfPath: row.pdf_path,
      createdAt: row.created_at,
    }));
  }
}

export const database: IDatabase = new SQLiteDatabase();
