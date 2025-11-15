# ImportFlow - Document Management & Inventory System

A comprehensive web application for managing import documents and tracking inventory with a clean, Notion-inspired interface.

## Features

### Document Management
- **Dashboard**: Real-time overview of pending approvals, approved/rejected documents, and KPIs
- **Document List**: Filter and search documents by type, status, supplier, and date
- **Create Documents**: Easy form-based document creation with file upload support
- **Document Detail**: Complete document view with approval workflow and timeline history
- **Role-Based Access**: Different views and permissions for Requesters, Approvers, and Finance

### Inventory Management
- **Inventory Dashboard**: Track total SKUs, stock quantities, values, and low-stock alerts
- **Product Catalog**: Manage product master data (SKU, name, category, pricing)
- **Stock Movements**: Track all IN/OUT/ADJUST transactions linked to documents
- **Category Breakdown**: Visual representation of stock by category
- **Low Stock Alerts**: Automatic alerts when stock reaches reorder point

### Key Capabilities
- Document approval workflows with history tracking
- Real-time status updates and notifications
- Stock movements automatically generated from approved documents
- Multi-warehouse support
- Role-based security with Row Level Security (RLS)
- Clean, minimal UI with excellent usability

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: TailwindCSS (Notion-style design)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (email/password)
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 16+
- Supabase account

### Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
The `.env` file already contains your Supabase credentials.

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## User Roles

- **Requester**: Create and submit documents for approval
- **Approver**: Review and approve/reject pending documents
- **Finance**: View financial data and manage stock
- **Admin**: Full access to all features

## Database Schema

The system includes the following main tables:
- `users_profile`: Extended user information with roles
- `documents`: Core document tracking
- `document_files`: File attachments
- `document_history`: Complete audit trail
- `products`: Product master data
- `stock_balances`: Current stock levels by warehouse
- `stock_movements`: All inventory transactions
- `warehouses`: Warehouse/location data
- `product_categories`: Product categorization

## Design Philosophy

The interface follows Notion's clean design principles:
- Minimal, uncluttered layouts
- Generous white space
- Subtle shadows and borders
- Soft, professional colors (no purple!)
- Clean typography
- Intuitive navigation
- Fast, responsive interactions

## Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Authentication required for all operations
- Audit trail for all document changes
- Secure password handling via Supabase Auth
