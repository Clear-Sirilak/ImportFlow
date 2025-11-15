import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { DocumentList } from './pages/DocumentList';
import { CreateDocument } from './pages/CreateDocument';
import { DocumentDetail } from './pages/DocumentDetail';
import { InventoryDashboard } from './pages/InventoryDashboard';
import { ProductCatalog } from './pages/ProductCatalog';
import { StockMovement } from './pages/StockMovement';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    if (authMode === 'register') {
      return <Register onLoginClick={() => setAuthMode('login')} />;
    }
    return <Login onRegisterClick={() => setAuthMode('register')} />;
  }

  const renderPage = () => {
    if (currentPage === 'document-detail' && selectedDocumentId) {
      return (
        <DocumentDetail
          documentId={selectedDocumentId}
          onBack={() => {
            setCurrentPage('documents');
            setSelectedDocumentId(null);
          }}
        />
      );
    }

    if (currentPage === 'create-document') {
      return (
        <CreateDocument
          onBack={() => setCurrentPage('documents')}
          onSuccess={() => {
            setCurrentPage('documents');
            alert('Document created successfully!');
          }}
        />
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'documents':
        return (
          <DocumentList
            onCreateNew={() => setCurrentPage('create-document')}
            onViewDocument={(id) => {
              setSelectedDocumentId(id);
              setCurrentPage('document-detail');
            }}
          />
        );
      case 'inventory':
        return <InventoryDashboard />;
      case 'products':
        return <ProductCatalog />;
      case 'stock-movements':
        return <StockMovement />;
      case 'reports':
        return (
          <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500 mt-1">Analytics and reporting features coming soon</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  const handleNavigate = (page: string) => {
    if (page === 'inventory') {
      setCurrentPage('inventory');
    } else if (page === 'documents') {
      setCurrentPage('documents');
    } else if (page === 'reports') {
      setCurrentPage('reports');
    } else {
      setCurrentPage(page);
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
