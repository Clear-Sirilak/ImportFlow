import { useState } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

interface CreateDocumentProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function CreateDocument({ onBack, onSuccess }: CreateDocumentProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    documentType: 'Purchase Order',
    documentNumber: '',
    supplierName: '',
    documentDate: new Date().toISOString().split('T')[0],
    documentValue: '',
    currency: 'USD',
    priority: 'Medium',
    approverId: '',
    remarks: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.from('documents').insert({
        document_type: formData.documentType,
        document_number: formData.documentNumber,
        supplier_name: formData.supplierName,
        document_date: formData.documentDate,
        document_value: parseFloat(formData.documentValue),
        currency: formData.currency,
        status: 'Draft',
        priority: formData.priority,
        created_by: user?.id,
        remarks: formData.remarks,
      }).select().single();

      if (error) throw error;

      if (data) {
        await supabase.from('document_history').insert({
          document_id: data.id,
          action_type: 'Created',
          new_status: 'Draft',
          performed_by: user?.id,
          remarks: 'Document created',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Failed to create document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        Back to Documents
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create New Document</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the document details below</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Document Type"
              value={formData.documentType}
              onChange={(e) => handleChange('documentType', e.target.value)}
              options={[
                { value: 'Purchase Order', label: 'Purchase Order' },
                { value: 'Invoice', label: 'Invoice' },
                { value: 'Goods Receipt', label: 'Goods Receipt' },
                { value: 'Delivery Note', label: 'Delivery Note' },
                { value: 'Packing List', label: 'Packing List' },
              ]}
              required
            />

            <Input
              label="Document Number"
              value={formData.documentNumber}
              onChange={(e) => handleChange('documentNumber', e.target.value)}
              placeholder="e.g., PO-2024-001"
              required
            />
          </div>

          <Input
            label="Supplier Name"
            value={formData.supplierName}
            onChange={(e) => handleChange('supplierName', e.target.value)}
            placeholder="Enter supplier or vendor name"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Document Date"
              type="date"
              value={formData.documentDate}
              onChange={(e) => handleChange('documentDate', e.target.value)}
              required
            />

            <Select
              label="Priority"
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'Urgent', label: 'Urgent' },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Document Value"
              type="number"
              step="0.01"
              value={formData.documentValue}
              onChange={(e) => handleChange('documentValue', e.target.value)}
              placeholder="0.00"
              required
            />

            <Select
              label="Currency"
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              options={[
                { value: 'USD', label: 'USD' },
                { value: 'EUR', label: 'EUR' },
                { value: 'GBP', label: 'GBP' },
                { value: 'JPY', label: 'JPY' },
                { value: 'CNY', label: 'CNY' },
              ]}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Remarks
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              placeholder="Add any additional notes or comments..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
            />
          </div>

          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-gray-600 mb-1">Drag and drop files here, or click to browse</p>
            <p className="text-xs text-gray-400">PDF, PNG, JPG up to 10MB</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Document'}
          </Button>
          <Button type="button" variant="ghost" onClick={onBack}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
