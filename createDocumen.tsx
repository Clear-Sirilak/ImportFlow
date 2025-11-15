import { useState, useRef } from 'react';
import { ArrowLeft, Upload, X, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

interface CreateDocumentProps {
  onBack: () => void;
  onSuccess: () => void;
}

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}

export function CreateDocument({ onBack, onSuccess }: CreateDocumentProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...newFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const newFiles: UploadedFile[] = Array.from(droppedFiles).map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: 'pending'
      }));

      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const uploadFilesToStorage = async (documentId: string) => {
    setUploading(true);
    
    for (const fileData of files) {
      try {
        // อัพเดทสถานะเป็นกำลังอัพโหลด
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'uploading', progress: 0 } : f
        ));

        // สร้าง unique file name
        const fileExt = fileData.file.name.split('.').pop();
        const fileName = `${documentId}/${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        // อัพโหลดไฟล์ไปยัง Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('document-files')
          .upload(fileName, fileData.file, {
            onUploadProgress: (progress) => {
              const percent = (progress.loaded / progress.total) * 100;
              setFiles(prev => prev.map(f => 
                f.id === fileData.id ? { ...f, progress: Math.round(percent) } : f
              ));
            }
          });

        if (uploadError) throw uploadError;

        // บันทึกข้อมูลไฟล์ในตาราง document_files
        const { error: dbError } = await supabase
          .from('document_files')
          .insert({
            document_id: documentId,
            file_name: fileData.file.name,
            file_url: uploadData?.path,
            file_size: fileData.file.size,
            file_type: fileData.file.type,
            uploaded_by: user?.id,
          });

        if (dbError) throw dbError;

        // อัพเดทสถานะเป็นสำเร็จ
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'completed', progress: 100 } : f
        ));

      } catch (error) {
        console.error('Error uploading file:', error);
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'error' } : f
        ));
      }
    }
    
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. สร้างเอกสารใน database
      const { data, error } = await supabase
        .from('documents')
        .insert({
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
        })
        .select()
        .single();

      if (error) throw error;

      // 2. บันทึกประวัติ
      if (data) {
        await supabase.from('document_history').insert({
          document_id: data.id,
          action_type: 'Created',
          new_status: 'Draft',
          performed_by: user?.id,
          remarks: 'Document created',
        });

        // 3. อัพโหลดไฟล์ถ้ามี
        if (files.length > 0) {
          await uploadFilesToStorage(data.id);
        }
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

          {/* File Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Attachments
            </label>
            
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-gray-300 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm text-gray-600 mb-1">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-xs text-gray-400">PDF, PNG, JPG up to 10MB</p>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((fileData) => (
                  <div
                    key={fileData.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {fileData.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(fileData.file.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Progress Indicator */}
                      {fileData.status === 'uploading' && (
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${fileData.progress}%` }}
                          />
                        </div>
                      )}

                      {fileData.status === 'completed' && (
                        <span className="text-xs text-green-600 font-medium">Uploaded</span>
                      )}

                      {fileData.status === 'error' && (
                        <span className="text-xs text-red-600 font-medium">Error</span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(fileData.id);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100">
          <Button 
            type="submit" 
            disabled={loading || uploading}
          >
            {loading ? 'Creating...' : uploading ? 'Uploading Files...' : 'Create Document'}
          </Button>
          <Button type="button" variant="ghost" onClick={onBack}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
