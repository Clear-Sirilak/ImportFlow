import { useEffect, useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Badge } from '../components/ui/Badge';

interface StockMovement {
  id: string;
  product_id: string;
  warehouse_id: string;
  movement_type: string;
  quantity: number;
  unit_cost: number | null;
  source_document_id: string | null;
  reference_number: string | null;
  remarks: string | null;
  movement_date: string;
  product_name?: string;
  product_sku?: string;
  warehouse_name?: string;
  document_number?: string;
}

export function StockMovement() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products(name, sku),
          warehouses(name),
          documents(document_number)
        `)
        .order('movement_date', { ascending: false })
        .limit(50);

      if (error) throw error;

      const movementsWithDetails = data?.map((movement: any) => ({
        ...movement,
        product_name: movement.products?.name || 'Unknown',
        product_sku: movement.products?.sku || 'N/A',
        warehouse_name: movement.warehouses?.name || 'Unknown',
        document_number: movement.documents?.document_number || null,
      })) || [];

      setMovements(movementsWithDetails);
    } catch (error) {
      console.error('Error loading movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <ArrowUpCircle className="w-5 h-5 text-green-600" strokeWidth={1.5} />;
      case 'OUT':
        return <ArrowDownCircle className="w-5 h-5 text-red-600" strokeWidth={1.5} />;
      case 'ADJUST':
        return <RefreshCw className="w-5 h-5 text-blue-600" strokeWidth={1.5} />;
      default:
        return null;
    }
  };

  const getMovementBadge = (type: string) => {
    const variants: Record<string, 'success' | 'danger' | 'info'> = {
      IN: 'success',
      OUT: 'danger',
      ADJUST: 'info',
    };
    return <Badge variant={variants[type] || 'neutral'}>{type}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading stock movements...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Stock Movements</h1>
        <p className="text-sm text-gray-500 mt-1">Track all inventory transactions and adjustments</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    No stock movements recorded yet.
                  </td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.movement_type)}
                        {getMovementBadge(movement.movement_type)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{movement.product_name}</p>
                        <p className="text-xs text-gray-500">{movement.product_sku}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600">{movement.warehouse_name}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className={`text-sm font-medium ${
                        movement.movement_type === 'IN'
                          ? 'text-green-600'
                          : movement.movement_type === 'OUT'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}>
                        {movement.movement_type === 'IN' ? '+' : movement.movement_type === 'OUT' ? '-' : ''}
                        {movement.quantity.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600">
                        {movement.unit_cost ? `$${movement.unit_cost.toFixed(2)}` : '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {movement.document_number ? (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                          <p className="text-sm text-gray-900">{movement.document_number}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Manual</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600">
                        {new Date(movement.movement_date).toLocaleString()}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <p>Showing {movements.length} movements</p>
      </div>
    </div>
  );
}
