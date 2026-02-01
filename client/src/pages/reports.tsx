import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { 
  TrendingUp, 
  Package, 
  Users, 
  IndianRupee,
  Calendar,
  BarChart3,
  Activity
} from "lucide-react";

interface ReportData {
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  todayOrders: number;
  itemTypeStats: { [key: string]: number };
  recentOrders: any[];
}

export default function Reports() {
  const [reportData, setReportData] = useState<ReportData>({
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    todayOrders: 0,
    itemTypeStats: {},
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('item_type, quantity');

      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders?.filter(order => 
        order.created_at.startsWith(today)
      ).length || 0;

      // Calculate item type statistics
      const itemTypeStats = {};
      orderItems?.forEach(item => {
        const type = item.item_type;
        itemTypeStats[type] = (itemTypeStats[type] || 0) + item.quantity;
      });

      setReportData({
        totalOrders: orders?.length || 0,
        totalCustomers: customerCount || 0,
        totalRevenue,
        todayOrders,
        itemTypeStats,
        recentOrders: orders?.slice(0, 5) || []
      });
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600">Business insights and performance metrics</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm shadow-lg px-4 py-2 text-lg">
            <Calendar className="w-4 h-4 mr-2" />
            {new Date().toLocaleDateString()}
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Orders</p>
                  <p className="text-3xl font-bold">{reportData.totalOrders}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Customers</p>
                  <p className="text-3xl font-bold">{reportData.totalCustomers}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold">₹{reportData.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <IndianRupee className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Today's Orders</p>
                  <p className="text-3xl font-bold">{reportData.todayOrders}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Item Type Statistics */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-3">
                <Activity className="w-5 h-5" />
                <span>Item Type Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {Object.entries(reportData.itemTypeStats).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${
                        type === 'box' ? 'bg-blue-500' :
                        type === 'envelope' ? 'bg-green-500' : 'bg-purple-500'
                      }`} />
                      <span className="capitalize font-medium text-gray-900">{type}</span>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {count} items
                    </Badge>
                  </div>
                ))}
                {Object.keys(reportData.itemTypeStats).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No item data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-3">
                <Package className="w-5 h-5" />
                <span>Recent Orders</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {reportData.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">Order #{order.id}</span>
                        <Badge variant="outline" className="text-xs">
                          {order.customer_name}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        📅 {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 text-lg">₹{order.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                {reportData.recentOrders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No recent orders</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <Card className="mt-8 shadow-xl border-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Business Summary</h3>
              <p className="text-indigo-100 mb-6">
                Your order management system is performing well with {reportData.totalOrders} total orders 
                from {reportData.totalCustomers} customers, generating ₹{reportData.totalRevenue.toFixed(2)} in revenue.
              </p>
              <div className="flex justify-center items-center space-x-8">
                <div className="text-center">
                  <div className="text-3xl font-bold">{reportData.todayOrders}</div>
                  <div className="text-indigo-200 text-sm">Today's Orders</div>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    ₹{reportData.totalCustomers > 0 ? (reportData.totalRevenue / reportData.totalCustomers).toFixed(0) : '0'}
                  </div>
                  <div className="text-indigo-200 text-sm">Avg. per Customer</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}