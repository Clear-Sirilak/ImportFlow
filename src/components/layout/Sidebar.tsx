import {
  LayoutDashboard,
  FileText,
  Package,
  BarChart3,
  LogOut,
  ChevronRight,
  Box,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const [inventoryOpen, setInventoryOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'documents', icon: FileText, label: 'Documents' },
    { id: 'reports', icon: BarChart3, label: 'Reports' },
  ];

  const inventoryItems = [
    { id: 'inventory', icon: Package, label: 'Overview' },
    { id: 'products', icon: Box, label: 'Products' },
    { id: 'stock-movements', icon: TrendingUp, label: 'Movements' },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-semibold text-gray-900">ImportFlow</h1>
        <p className="text-xs text-gray-500 mt-1">Document & Inventory</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4" strokeWidth={1.5} />}
            </button>
          );
        })}

        <div className="pt-2">
          <button
            onClick={() => setInventoryOpen(!inventoryOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
          >
            <Package className="w-4 h-4" strokeWidth={1.5} />
            <span className="flex-1 text-left">Inventory</span>
            <ChevronRight
              className={`w-4 h-4 transition-transform ${inventoryOpen ? 'rotate-90' : ''}`}
              strokeWidth={1.5}
            />
          </button>

          {inventoryOpen && (
            <div className="ml-3 mt-1 space-y-1">
              {inventoryItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
          <p className="text-xs text-gray-500">{profile?.role}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
