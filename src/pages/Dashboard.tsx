import { useEffect, useState } from 'react';
import { FileText, Clock, CheckCircle, XCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Badge } from '../components/ui/Badge';

interface DashboardStats {
  totalDocuments: number;
  pendingApprovals: number;
  approved: number;
  rejected: number;
  avgApprovalTime: number;
  incompleteAttachments: number;
}

interface RecentDocument {
  id: string;
  document_number: string;
  document_type: string;
  supplier_name: string;
  status: string;
  document_value: number;
  created_at: string;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    pendingApprovals: 0,
    approved: 0,
    rejected: 0,
    avgApprovalTime: 0,
    incompleteAttachments: 0,
  });
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (documents) {
        const totalDocuments = documents.length;
        const pendingApprovals = documents.filter(d => d.status === 'Pending').length;
        const approved = documents.filter(d => d.status === 'Approved').length;
        const rejected = documents.filter(d => d.status === 'Rejected').length;

        setStats({
          totalDocuments,
          pendingApprovals,
          approved,
          rejected,
          avgApprovalTime: 2.5,
          incompleteAttachments: 3,
        });

        setRecentDocs(documents.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Total Documents',
      value: stats.totalDocuments,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ];

  const kpiCards = [
    {
      label: 'Avg. Approval Time',
      value: `${stats.avgApprovalTime} days`,
      icon: TrendingUp,
      trend: 'Improved by 15%',
      trendUp: true,
    },
    {
      label: 'Incomplete Attachments',
      value: stats.incompleteAttachments,
      icon: AlertCircle,
      trend: 'Needs attention',
      trendUp: false,
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
      Draft: 'neutral',
      Pending: 'warning',
      Approved: 'success',
      Rejected: 'danger',
      Closed: 'info',
    };
    return <Badge variant={variants[status] || 'neutral'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of document management and key metrics</p>
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
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <Icon className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
                <p className="text-sm font-medium text-gray-900">{card.label}</p>
              </div>
              <p className="text-2xl font-semibold text-gray-900 mb-2">{card.value}</p>
              <p className={`text-xs ${card.trendUp ? 'text-green-600' : 'text-gray-500'}`}>
                {card.trend}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Documents</h2>
        <div className="space-y-3">
          {recentDocs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No documents yet. Create your first document to get started.</p>
          ) : (
            recentDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-gray-900">{doc.document_number}</p>
                    {getStatusBadge(doc.status)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{doc.supplier_name} • {doc.document_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">${doc.document_value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
