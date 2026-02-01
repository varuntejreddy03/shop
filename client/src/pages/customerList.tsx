import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Search, Phone, Calendar, User, Printer, ChevronDown, ChevronUp, Users } from "lucide-react";

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

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedCustomer, setExpandedCustomer] = useState<number | null>(null);
  const [loadingOrders, setLoadingOrders] = useState<number | null>(null);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, created_at')
        .order('created_at', { ascending: false });

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
      const { printOrderPDF } = await import('@/lib/pdfGenerator');
      const customer = customers.find(c => c.id === expandedCustomer);
      if (!customer) {
        alert('Customer not found');
        return;
      }
      
      const orderData = {
        customerName: customer.name,
        phoneNumber: customer.phone,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
              <p className="text-gray-600">Manage customers and reprint orders</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm shadow-lg px-4 py-2 text-lg">
            {customers.length} Total Customers
          </Badge>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center space-x-3">
              <Search className="w-5 h-5" />
              <Input
                placeholder="Search customers by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/30"
              />
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading customers...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCustomers.map((customer) => (
                  <Card key={customer.id} className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{customer.name}</h3>
                            <p className="text-sm text-gray-500">Customer ID: #{customer.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="bg-gray-50">
                            {customer.order_count || 0} orders
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExpandCustomer(customer)}
                            disabled={loadingOrders === customer.id}
                            className="hover:bg-blue-50"
                          >
                            {loadingOrders === customer.id ? (
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : expandedCustomer === customer.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{customer.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(customer.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="font-medium text-green-600">
                          Total Spent: ₹{customer.total_spent?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                      
                      {expandedCustomer === customer.id && customer.orders && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            📋 Order History
                          </h4>
                          {customer.orders.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No orders found for this customer.</p>
                          ) : (
                            <div className="space-y-3">
                              {customer.orders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                                  <div>
                                    <div className="font-medium text-gray-900">Order #{order.id}</div>
                                    <div className="text-sm text-gray-600">
                                      📅 {new Date(order.order_date).toLocaleDateString()} • 
                                      💰 ₹{order.total_amount.toFixed(2)} • 
                                      📦 {order.order_items?.length || 0} items
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePrintOrder(order)}
                                    className="flex items-center space-x-2 hover:bg-blue-50 border-blue-200 text-blue-700"
                                  >
                                    <Printer className="w-4 h-4" />
                                    <span>Print</span>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {!loading && filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'No customers have been added yet.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}