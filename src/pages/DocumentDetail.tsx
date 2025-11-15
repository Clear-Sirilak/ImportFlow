import { useEffect, useState } from 'react';
import { ArrowLeft, FileText, Clock, User, Calendar, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface DocumentDetailProps {
  documentId: string;
  onBack: () => void;
}

interface Document {
  id: string;
  document_type: string;
  document_number: string;
  supplier_name: string;
  document_date: string;
  document_value: number;
  currency: string;
  status: string;
  priority: string;
  remarks: string | null;
  rejection_reason: string | null;
  created_at: string;
  created_by: string | null;
  approver_id: string | null;
}

interface HistoryItem {
  id: string;
  action_type: string;
  old_status: string | null;
  new_status: string | null;
  remarks: string | null;
  created_at: string;
  performed_by: string | null;
  user_name?: string;
}

export function DocumentDetail({ documentId, onBack }: DocumentDetailProps) {
  const { user, profile } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadDocument();
    loadHistory();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .maybeSingle();

      if (error) throw error;
      setDocument(data);
    } catch (error) {
      console.error('Error loading document:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('document_history')
        .select(`
          *,
          users_profile!document_history_performed_by_fkey(full_name)
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const historyWithNames = data?.map((item: any) => ({
        ...item,
        user_name: item.users_profile?.full_name || 'System',
      })) || [];

      setHistory(historyWithNames);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleApprove = async () => {
    if (!document) return;
    setActionLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('documents')
        .update({ status: 'Approved' })
        .eq('id', documentId);

      if (updateError) throw updateError;

      await supabase.from('document_history').insert({
        document_id: documentId,
        action_type: 'Approved',
        old_status: document.status,
        new_status: 'Approved',
        performed_by: user?.id,
        remarks: 'Document approved',
      });

      await loadDocument();
      await loadHistory();
    } catch (error) {
      console.error('Error approving document:', error);
      alert('Failed to approve document. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!document || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    setActionLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          status: 'Rejected',
          rejection_reason: rejectionReason,
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      await supabase.from('document_history').insert({
        document_id: documentId,
        action_type: 'Rejected',
        old_status: document.status,
        new_status: 'Rejected',
        performed_by: user?.id,
        remarks: rejectionReason,
      });

      setShowRejectModal(false);
      setRejectionReason('');
      await loadDocument();
      await loadHistory();
    } catch (error) {
      console.error('Error rejecting document:', error);
      alert('Failed to reject document. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!document) return;
    setActionLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('documents')
        .update({ status: 'Pending' })
        .eq('id', documentId);

      if (updateError) throw updateError;

      await supabase.from('document_history').insert({
        document_id: documentId,
        action_type: 'Submitted',
        old_status: document.status,
        new_status: 'Pending',
        performed_by: user?.id,
        remarks: 'Submitted for approval',
      });

      await loadDocument();
      await loadHistory();
    } catch (error) {
      console.error('Error submitting document:', error);
      alert('Failed to submit document. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

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

  const canApprove = profile?.role === 'Approver' || profile?.role === 'Admin';
  const canEdit = document?.created_by === user?.id && document?.status === 'Draft';
  const canSubmit = document?.created_by === user?.id && document?.status === 'Draft';

  if (loading || !document) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading document...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        Back to Documents
      </button>

      <div className="bg-white rounded-xl border border-gray-100 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <FileText className="w-6 h-6 text-gray-700" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{document.document_number}</h1>
              <p className="text-sm text-gray-500 mt-1">{document.document_type}</p>
            </div>
          </div>
          {getStatusBadge(document.status)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-gray-400 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-gray-500">Supplier</p>
                <p className="text-sm font-medium text-gray-900">{document.supplier_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-gray-500">Document Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(document.document_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="w-4 h-4 text-gray-400 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-gray-500">Value</p>
                <p className="text-sm font-medium text-gray-900">
                  {document.currency} {document.document_value.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(document.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="info">{document.priority}</Badge>
            </div>
          </div>
        </div>

        {document.remarks && (
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <p className="text-xs text-gray-500 mb-1">Remarks</p>
            <p className="text-sm text-gray-700">{document.remarks}</p>
          </div>
        )}

        {document.rejection_reason && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg mb-6">
            <p className="text-xs text-red-700 font-medium mb-1">Rejection Reason</p>
            <p className="text-sm text-red-600">{document.rejection_reason}</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
          {canApprove && document.status === 'Pending' && (
            <>
              <Button onClick={handleApprove} disabled={actionLoading}>
                <CheckCircle className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Approve
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
              >
                <XCircle className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Reject
              </Button>
            </>
          )}

          {canSubmit && (
            <Button onClick={handleSubmitForApproval} disabled={actionLoading}>
              Submit for Approval
            </Button>
          )}

          {canEdit && (
            <Button variant="secondary">Edit Document</Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Document History</h2>
        <div className="space-y-4">
          {history.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No history available</p>
          ) : (
            history.map((item, index) => (
              <div key={item.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  {index < history.length - 1 && <div className="w-0.5 h-full bg-gray-200 my-1" />}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">{item.action_type}</p>
                    {item.new_status && (
                      <span className="text-xs text-gray-500">
                        → {item.new_status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    {item.user_name} • {new Date(item.created_at).toLocaleString()}
                  </p>
                  {item.remarks && (
                    <p className="text-sm text-gray-600 mt-2">{item.remarks}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Document</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all mb-4"
            />
            <div className="flex items-center gap-3">
              <Button onClick={handleReject} variant="danger" disabled={actionLoading}>
                Confirm Rejection
              </Button>
              <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
