# Print-Ready Order Management System

## Overview
A web-based order management system that generates professional, print-ready PDF order forms. Users can create orders with different item types (Box, Envelope, Bag), and the system automatically generates PDFs, saves them, and triggers the print dialog.

## Architecture

### Frontend (React + TypeScript)
- **Framework**: React with TypeScript, Vite bundler
- **Styling**: TailwindCSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Forms**: react-hook-form with Zod validation
- **Routing**: wouter

### Backend (Node.js + Express)
- **API**: Express.js REST API
- **Database**: SQLite (via better-sqlite3) - Supabase-ready abstraction
- **PDF Generation**: pdf-lib for A4, print-optimized PDFs

### Key Files
- `client/src/pages/home.tsx` - Main order form component
- `shared/schema.ts` - Data models and Zod schemas
- `server/database.ts` - Abstracted database layer (SQLite, Supabase-ready)
- `server/pdf-generator.ts` - PDF generation logic
- `server/routes.ts` - API endpoints

## Database Schema

### SQLite Tables
```sql
customers (id, name, phone, created_at)
orders (id, customer_id, order_date, total_amount, pdf_path, created_at)
order_items (id, order_id, item_type, item_data, quantity, price)
```

### Supabase Migration Notes
The database layer is abstracted through the `IDatabase` interface in `server/database.ts`:
- `createCustomer()`, `getCustomerById()`, `findCustomerByPhone()`
- `createOrder()`, `getOrderById()`, `getOrderWithItems()`, `updateOrderPdfPath()`
- `getAllOrders()`

To migrate to Supabase:
1. Create a `SupabaseDatabase` class implementing `IDatabase`
2. Replace SQLite queries with Supabase client calls
3. Update the export to use the new implementation

## API Endpoints

### POST /api/create-order
Creates an order, saves to database, generates PDF
- Request: `CreateOrderInput` (customerName, phoneNumber, orderDate, items[])
- Response: `CreateOrderResponse` (success, orderId, pdfUrl, message)

### GET /api/pdf/:filename
Serves generated PDF files for printing

### GET /api/orders
Lists all orders

### GET /api/orders/:id
Gets order details with items

## Item Types

### Box
- boxType, length, breadth, height, printType, quantity, price

### Envelope  
- envelopeSize, envelopePrintType, quantity, price

### Bag
- doreType, bagSize, bagPrintType, quantity, price

## Folder Structure
```
/data/orders.db          - SQLite database file
/generated-pdfs/         - Generated PDF order forms
/client/src/pages/       - React page components
/server/                 - Express backend
/shared/                 - Shared types and schemas
```

## Running the App
```bash
npm run dev    # Starts both frontend and backend
```

The app runs on port 5000.
