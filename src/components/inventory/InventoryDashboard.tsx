import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  ShoppingCart,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import {
  InventoryItem,
  InventoryStatistics,
} from '../../types/inventory';

const InventoryDashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<InventoryStatistics | null>(null);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, lowStockData, expiringData] = await Promise.all([
        inventoryService.getStatistics(),
        inventoryService.getLowStockItems(),
        inventoryService.getExpiringItems(30),
      ]);

      setStatistics(statsData);
      setLowStockItems(lowStockData);
      setExpiringItems(expiringData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Items"
          value={statistics?.summary.totalItems || 0}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Total Value"
          value={formatCurrency(statistics?.summary.totalValue || 0)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Low Stock Items"
          value={statistics?.summary.lowStockItems || 0}
          subtitle={lowStockItems.length > 0 ? 'Requires attention' : 'All good'}
          icon={AlertTriangle}
          color={statistics?.summary.lowStockItems > 0 ? 'yellow' : 'green'}
        />
        <StatCard
          title="Out of Stock"
          value={statistics?.summary.outOfStockItems || 0}
          subtitle={statistics?.summary.outOfStockItems > 0 ? 'Needs restocking' : 'All stocked'}
          icon={ShoppingCart}
          color={statistics?.summary.outOfStockItems > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No low stock items</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        Stock: {item.currentStock} | Reorder: {item.reorderLevel}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      {item.category.name}
                    </Badge>
                  </div>
                ))}
                {lowStockItems.length > 5 && (
                  <Button variant="outline" className="w-full">
                    View All {lowStockItems.length} Low Stock Items
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Expiring Soon (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiringItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No items expiring soon</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expiringItems.slice(0, 5).map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        Expires: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'No date'}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                      {item.category.name}
                    </Badge>
                  </div>
                ))}
                {expiringItems.length > 5 && (
                  <Button variant="outline" className="w-full">
                    View All {expiringItems.length} Expiring Items
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Inventory by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statistics?.categoryBreakdown.slice(0, 6).map((category) => (
              <div key={category._id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{category.categoryInfo.name}</h3>
                  <Badge
                    variant="outline"
                    style={{ backgroundColor: category.categoryInfo.color }}
                  >
                    {category.itemCount} items
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  Total Value: {formatCurrency(category.totalValue)}
                </div>
              </div>
            ))}
          </div>
          {statistics?.categoryBreakdown.length > 6 && (
            <Button variant="outline" className="w-full mt-4">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Detailed Analytics
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-16 flex flex-col items-center justify-center gap-2">
              <Package className="h-5 w-5" />
              Add New Item
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Stock Movement
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryDashboard;