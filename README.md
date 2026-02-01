# Order Management System

A modern order management system for printing businesses with PDF generation capabilities.

## Features

- Create and manage orders for boxes, envelopes, and bags
- Customer management
- PDF generation for production orders
- Reports and analytics
- Clean, professional UI

## Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/varuntejreddy03/shop.git
cd shop
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy example files
cp .env.example .env
cp client/.env.example client/.env

# Edit the files with your actual values
```

4. Configure Supabase:
   - Create a new Supabase project
   - Set up the database schema (tables: customers, orders, order_items, admins)
   - Add your Supabase URL and anon key to the environment files

5. Start the development server:
```bash
npm run dev
```

## Environment Variables

### Root `.env`
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 5000)

### Client `.env`
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

## Database Schema

The application requires the following Supabase tables:

### customers
- id (int, primary key)
- name (text)
- phone (text)
- created_at (timestamp)

### orders
- id (int, primary key)
- customer_id (int, foreign key)
- customer_name (text)
- phone_number (text)
- order_date (date)
- total_amount (decimal)
- created_at (timestamp)

### order_items
- id (int, primary key)
- order_id (int, foreign key)
- item_type (text)
- quantity (int)
- price (decimal)
- item_data (jsonb)

### admins
- id (int, primary key)
- username (text)
- password (text)

## Usage

1. Access the application at `http://localhost:5000`
2. Login with admin credentials
3. Create orders, manage customers, and view reports
4. PDFs are automatically generated for production orders

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **PDF Generation**: pdf-lib
- **Build Tool**: Vite

## License

MIT License