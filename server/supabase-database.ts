import { createClient } from '@supabase/supabase-js';
import type { Customer, Order, OrderItemRecord, CreateOrderInput } from "../shared/schema";

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://csniddtrkxtwxnlpwrly.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbmlkZHRya3h0d3hubHB3cmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTk1NTAsImV4cCI6MjA4NTUzNTU1MH0.40JvnW6i3xQrF2Sx_F7QabhRYIT6tl3RLUKmlPyjmv0';

const supabase = createClient(supabaseUrl, supabaseKey);

export interface IDatabase {
  createCustomer(name: string, phone: string): Promise<Customer>;
  getCustomerById(id: number): Promise<Customer | undefined>;
  findCustomerByPhone(phone: string): Promise<Customer | undefined>;
  
  createOrder(input: CreateOrderInput): Promise<{ order: Order; customer: Customer }>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrderWithItems(id: number): Promise<{ order: Order; customer: Customer; items: OrderItemRecord[] } | undefined>;
  
  getAllOrders(): Promise<Order[]>;
}

class SupabaseDatabase implements IDatabase {
  async createCustomer(name: string, phone: string): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert({ name, phone })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      createdAt: data.created_at,
    };
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      createdAt: data.created_at,
    };
  }

  async findCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error || !data) return undefined;

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      createdAt: data.created_at,
    };
  }

  async createOrder(input: CreateOrderInput): Promise<{ order: Order; customer: Customer }> {
    let customer = await this.findCustomerByPhone(input.phoneNumber);
    if (!customer) {
      customer = await this.createCustomer(input.customerName, input.phoneNumber);
    }

    const totalAmount = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customer.id,
        order_date: input.orderDate,
        total_amount: totalAmount,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const orderItems = input.items.map(item => {
      const { itemType, quantity, price, ...itemData } = item;
      return {
        order_id: orderData.id,
        item_type: itemType,
        item_data: JSON.stringify(itemData),
        quantity,
        price,
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    console.log(`[DB] Order #${orderData.id} created for customer ${customer.name}`);

    const order: Order = {
      id: orderData.id,
      customerId: orderData.customer_id,
      orderDate: orderData.order_date,
      totalAmount: orderData.total_amount,
      pdfPath: orderData.pdf_path,
      createdAt: orderData.created_at,
    };

    return { order, customer };
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;

    return {
      id: data.id,
      customerId: data.customer_id,
      orderDate: data.order_date,
      totalAmount: data.total_amount,
      pdfPath: data.pdf_path,
      createdAt: data.created_at,
    };
  }

  async getOrderWithItems(id: number): Promise<{ order: Order; customer: Customer; items: OrderItemRecord[] } | undefined> {
    const order = await this.getOrderById(id);
    if (!order) return undefined;

    const customer = await this.getCustomerById(order.customerId);
    if (!customer) return undefined;

    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id);

    if (itemsError) throw itemsError;

    const items: OrderItemRecord[] = itemsData.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      itemType: row.item_type,
      itemData: row.item_data,
      quantity: row.quantity,
      price: row.price,
    }));

    return { order, customer, items };
  }

  async updateOrderPdfPath(orderId: number, pdfPath: string): Promise<void> {
    // PDF path no longer stored in database
    console.log(`[DB] Order #${orderId} PDF generated: ${pdfPath}`);
  }

  async getAllOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      orderDate: row.order_date,
      totalAmount: row.total_amount,
      pdfPath: null,
      createdAt: row.created_at,
    }));
  }
}

export const database: IDatabase = new SupabaseDatabase();