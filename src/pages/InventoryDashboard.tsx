import { useEffect, useState } from 'react';
import { Package, TrendingUp, TrendingDown, AlertTriangle, DollarSign, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface InventoryStats {
  totalSKUs: number;
  totalQuantity: number;
  totalValue: number;
  lowStockItems: number;
}

interface CategoryBreakdown {
  category: string;
  quantity: number;
  value: number;
}

interface StockAlert {
  product_name: string;
  sku: string;
  quantity: number;
  reorder_point: number;
}

export function InventoryDashboard() {
  const [stats, setStats] = useState<InventoryStats>({
    totalSKUs: 0,
    totalQuantity: 0,
    totalValue: 0,
    lowStockItems: 0,
  });
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      const { data: products } = await supabase
        .from('products')
        .select(`
          *,
          stock_balances(quantity_on_hand),
          product_categories(name)
        `)
        .eq('is_active', true);

      if (products) {
        const totalSKUs = products.length;
        let totalQuantity = 0;
        let totalValue = 0;
        let lowStockItems = 0;
        const categoryMap = new Map<string, { quantity: number; value: number }>();
        const alerts: StockAlert[] = [];

        products.forEach((product: any) => {
          const stockBalance = product.stock_balances?.[0];
          const quantity = stockBalance?.quantity_on_hand || 0;
          const value = quantity * product.cost_price;

          totalQuantity += quantity;
          totalValue += value;

          if (quantity <= product.reorder_point) {
            lowStockItems++;
            alerts.push({
              product_name: product.name,
              sku: product.sku,
              quantity,
              reorder_point: product.reorder_point,
            });
          }

          const categoryName = product.product_categories?.name || 'Uncategorized';
          const existing = categoryMap.get(categoryName) || { quantity: 0, value: 0 };
          categoryMap.set(categoryName, {
            quantity: existing.quantity + quantity,
            value: existing.value + value,
          });
        });

        setStats({ totalSKUs, totalQuantity, totalValue, lowStockItems });

        const breakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
          category,
          quantity: data.quantity,
          value: data.value,
        }));
        setCategoryBreakdown(breakdown);
        setLowStockAlerts(alerts);
      }
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total SKUs',
      value: stats.totalSKUs,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Total Quantity',
      value: stats.totalQuantity.toLocaleString(),
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Stock Value',
      value: `$${stats.totalValue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading inventory data...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Inventory Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of stock levels and inventory metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">{card.label}</p>
              <p className="text-3xl font-semibold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock by Category</h2>
          <div className="space-y-4">
            {categoryBreakdown.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No category data available</p>
            ) : (
              categoryBreakdown.map((item) => (
                <div key={item.category} className="flex items-center justify-between p-4 rounded-lg border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.category}</p>
                    <p className="text-xs text-gray-500">{item.quantity.toLocaleString()} units</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    ${item.value.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" strokeWidth={1.5} />
            Low Stock Alerts
          </h2>
          <div className="space-y-3">
            {lowStockAlerts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">All stock levels are healthy</p>
            ) : (
              lowStockAlerts.slice(0, 5).map((alert) => (
                <div key={alert.sku} className="flex items-center justify-between p-4 rounded-lg border border-red-100 bg-red-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{alert.product_name}</p>
                    <p className="text-xs text-gray-500">{alert.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">{alert.quantity} units</p>
                    <p className="text-xs text-gray-500">Min: {alert.reorder_point}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock Movement Trends</h2>
        <div className="flex items-center justify-center py-12 text-gray-500">
          <BarChart3 className="w-8 h-8 mr-3" strokeWidth={1.5} />
          <p className="text-sm">Stock movement chart coming soon</p>
        </div>
      </div>
    </div>
  );
}
