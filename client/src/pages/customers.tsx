import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface Customer {
  id: number;
  name: string;
  phone: string;
  created_at: string;
  order_count?: number;
  total_spent?: number;
  orders?: Order[];
}

interface Order {
  id: number;
  order_date: string;
  total_amount: number;
  order_items: OrderItem[];
}

interface OrderItem {
  id: number;
  item_type: string;
  quantity: number;
  price: number;
  item_data: string | any;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedCustomer, setExpandedCustomer] = useState<number | null>(null);
  const [loadingOrders, setLoadingOrders] = useState<number | null>(null);

  const fetchCustomers = async () => {
    try {
      // Force completely new query to bypass cache
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, created_at')
        .order('id', { ascending: true })
        .limit(100);

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerOrders = async (customer: Customer) => {
    if (customer.orders) return;
    
    setLoadingOrders(customer.id);
    try {
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          id,
          order_date,
          total_amount,
          order_items(
            id,
            item_type,
            quantity,
            price,
            item_data
          )
        `)
        .eq('customer_id', customer.id);

      setCustomers(prev => prev.map(c => 
        c.id === customer.id 
          ? { 
              ...c, 
              orders: ordersData || [],
              order_count: ordersData?.length || 0,
              total_spent: ordersData?.reduce((sum, order) => sum + order.total_amount, 0) || 0
            }
          : c
      ));
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoadingOrders(null);
    }
  };

  const handleExpandCustomer = (customer: Customer) => {
    if (expandedCustomer === customer.id) {
      setExpandedCustomer(null);
    } else {
      setExpandedCustomer(customer.id);
      loadCustomerOrders(customer);
    }
  };

  const handlePrintOrder = async (order: Order) => {
    try {
      const { printOrderPDF } = await import('../lib/pdfGenerator');
      const orderData = {
        customerName: expandedCustomer ? customers.find(c => c.id === expandedCustomer)?.name || '' : '',
        phoneNumber: expandedCustomer ? customers.find(c => c.id === expandedCustomer)?.phone || '' : '',
        orderDate: order.order_date,
        items: order.order_items.map(item => {
          const itemData = typeof item.item_data === 'string' ? JSON.parse(item.item_data) : item.item_data;
          return {
            itemType: item.item_type,
            quantity: item.quantity,
            price: item.price,
            ...itemData
          };
        })
      };
      
      printOrderPDF(orderData, order.id);
    } catch (error) {
      console.error('Error printing order:', error);
      alert('Error printing order');
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customer Management</h2>
        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
          {customers.length} Total Customers
        </span>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search customers by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">Loading customers...</div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="border-l-4 border-l-blue-500 bg-white rounded border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600">👤</span>
                      <h3 className="font-semibold">{customer.name}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                        {customer.order_count || 0} orders
                      </span>
                      <button
                        className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
                        onClick={() => handleExpandCustomer(customer)}
                        disabled={loadingOrders === customer.id}
                      >
                        {loadingOrders === customer.id ? '...' : 
                         expandedCustomer === customer.id ? '🔼' : '🔽'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <span>📞</span>
                      <span>{customer.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>📅</span>
                      <span>{new Date(customer.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="font-medium text-green-600">
                      Total Spent: ₹{customer.total_spent?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  
                  {expandedCustomer === customer.id && customer.orders && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-3">Order History</h4>
                      <div className="space-y-2">
                        {customer.orders.map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="text-sm">
                              <div className="font-medium">Order #{order.id}</div>
                              <div className="text-gray-600">
                                {new Date(order.order_date).toLocaleDateString()} • ₹{order.total_amount.toFixed(2)}
                              </div>
                            </div>
                            <button
                              onClick={() => handlePrintOrder(order)}
                              className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
                            >
                              <span>🖨️</span>
                              <span>Print</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {!loading && filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No customers found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}