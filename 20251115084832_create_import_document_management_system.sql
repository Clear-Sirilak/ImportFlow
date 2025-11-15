/*
  # Import Document Management and Process Tracking System - Complete Database Schema

  ## Overview
  This migration creates a comprehensive database for an import document management system
  with integrated inventory/stock management. It supports document workflows, approvals,
  and real-time stock tracking.

  ## 1. New Tables

  ### users_profile
  Extended user profile information
  - `id` (uuid, primary key) - Links to auth.users
  - `full_name` (text) - User's full name
  - `email` (text) - User's email
  - `department` (text) - Department (Procurement, Finance, Warehouse, Management)
  - `role` (text) - System role (Requester, Approver, Finance, Admin)
  - `avatar_url` (text, optional) - Profile picture URL
  - `created_at` (timestamptz) - Profile creation timestamp

  ### documents
  Core document tracking table
  - `id` (uuid, primary key)
  - `document_type` (text) - Type: Purchase Order, Invoice, Goods Receipt, etc.
  - `document_number` (text, unique) - Unique document identifier
  - `supplier_name` (text) - Supplier/vendor name
  - `document_date` (date) - Document issue date
  - `document_value` (numeric) - Total document value/amount
  - `currency` (text) - Currency code (USD, EUR, etc.)
  - `status` (text) - Current status: Draft, Pending, Approved, Rejected, Closed
  - `priority` (text) - Priority level: Low, Medium, High, Urgent
  - `approver_id` (uuid) - Assigned approver user ID
  - `created_by` (uuid) - Document creator user ID
  - `remarks` (text, optional) - General remarks/notes
  - `rejection_reason` (text, optional) - Reason if rejected
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### document_files
  Attached files for documents
  - `id` (uuid, primary key)
  - `document_id` (uuid) - Parent document
  - `file_name` (text) - Original filename
  - `file_url` (text) - Storage URL/path
  - `file_size` (integer) - File size in bytes
  - `file_type` (text) - MIME type
  - `uploaded_by` (uuid) - Uploader user ID
  - `uploaded_at` (timestamptz) - Upload timestamp

  ### document_history
  Complete audit trail of document changes
  - `id` (uuid, primary key)
  - `document_id` (uuid) - Related document
  - `action_type` (text) - Action: Created, Updated, Approved, Rejected, etc.
  - `old_status` (text, optional) - Previous status
  - `new_status` (text, optional) - New status
  - `performed_by` (uuid) - User who performed action
  - `remarks` (text, optional) - Action notes
  - `created_at` (timestamptz) - Action timestamp

  ### warehouses
  Warehouse/location master data
  - `id` (uuid, primary key)
  - `code` (text, unique) - Warehouse code
  - `name` (text) - Warehouse name
  - `location` (text, optional) - Physical location
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz)

  ### product_categories
  Product categorization
  - `id` (uuid, primary key)
  - `code` (text, unique) - Category code
  - `name` (text) - Category name
  - `description` (text, optional)
  - `created_at` (timestamptz)

  ### products
  Product master data catalog
  - `id` (uuid, primary key)
  - `sku` (text, unique) - Stock Keeping Unit
  - `name` (text) - Product name
  - `description` (text, optional) - Product description
  - `category_id` (uuid) - Product category
  - `unit_of_measure` (text) - Unit: PCS, KG, BOX, etc.
  - `cost_price` (numeric) - Standard cost price
  - `reorder_point` (integer) - Minimum stock level trigger
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### stock_balances
  Current stock on-hand by warehouse
  - `id` (uuid, primary key)
  - `product_id` (uuid) - Product reference
  - `warehouse_id` (uuid) - Warehouse reference
  - `quantity_on_hand` (numeric) - Current quantity
  - `reserved_quantity` (numeric) - Reserved/allocated quantity
  - `available_quantity` (numeric, computed) - Available = OnHand - Reserved
  - `last_movement_at` (timestamptz, optional) - Last stock movement timestamp
  - `updated_at` (timestamptz)

  ### stock_movements
  All stock transactions (IN/OUT/ADJUST)
  - `id` (uuid, primary key)
  - `product_id` (uuid) - Product reference
  - `warehouse_id` (uuid) - Warehouse reference
  - `movement_type` (text) - Type: IN, OUT, ADJUST
  - `quantity` (numeric) - Quantity moved (positive or negative)
  - `unit_cost` (numeric, optional) - Cost per unit
  - `source_document_id` (uuid, optional) - Related document
  - `reference_number` (text, optional) - External reference
  - `remarks` (text, optional) - Movement notes
  - `performed_by` (uuid) - User who performed movement
  - `movement_date` (timestamptz) - Movement timestamp
  - `created_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Create restrictive policies requiring authentication
  - Policies check user roles and ownership where appropriate

  ## 3. Indexes
  - Performance indexes on foreign keys and frequently queried columns
  - Unique constraints on business keys (document_number, SKU, etc.)

  ## 4. Important Notes
  - All timestamps use timestamptz for timezone awareness
  - Numeric types used for financial/quantity data to prevent precision loss
  - Comprehensive foreign key relationships ensure data integrity
  - History and audit tables track all changes for compliance
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS & PROFILES
-- =============================================

CREATE TABLE IF NOT EXISTS users_profile (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  department text NOT NULL DEFAULT 'General',
  role text NOT NULL DEFAULT 'Requester',
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON users_profile FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =============================================
-- 2. WAREHOUSES & CATEGORIES
-- =============================================

CREATE TABLE IF NOT EXISTS warehouses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  location text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view warehouses"
  ON warehouses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage warehouses"
  ON warehouses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'Admin'
    )
  );

CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categories"
  ON product_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON product_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'Admin'
    )
  );

-- =============================================
-- 3. PRODUCTS
-- =============================================

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES product_categories(id) ON DELETE SET NULL,
  unit_of_measure text NOT NULL DEFAULT 'PCS',
  cost_price numeric(15,2) DEFAULT 0,
  reorder_point integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authorized users can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role IN ('Admin', 'Finance')
    )
  );

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- =============================================
-- 4. DOCUMENTS
-- =============================================

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type text NOT NULL,
  document_number text UNIQUE NOT NULL,
  supplier_name text NOT NULL,
  document_date date NOT NULL,
  document_value numeric(15,2) DEFAULT 0,
  currency text DEFAULT 'USD',
  status text NOT NULL DEFAULT 'Draft',
  priority text DEFAULT 'Medium',
  approver_id uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  remarks text,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents they created or approve"
  ON documents FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by 
    OR auth.uid() = approver_id
    OR EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role IN ('Admin', 'Finance')
    )
  );

CREATE POLICY "Users can create documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their draft documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by AND status = 'Draft')
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Approvers can update documents assigned to them"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = approver_id)
  WITH CHECK (auth.uid() = approver_id);

CREATE POLICY "Admins can manage all documents"
  ON documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'Admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_approver ON documents(approver_id);
CREATE INDEX IF NOT EXISTS idx_documents_date ON documents(document_date);

-- =============================================
-- 5. DOCUMENT FILES
-- =============================================

CREATE TABLE IF NOT EXISTS document_files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer DEFAULT 0,
  file_type text,
  uploaded_by uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files for documents they can access"
  ON document_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_files.document_id
      AND (
        documents.created_by = auth.uid()
        OR documents.approver_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users_profile
          WHERE users_profile.id = auth.uid()
          AND users_profile.role IN ('Admin', 'Finance')
        )
      )
    )
  );

CREATE POLICY "Users can upload files to their documents"
  ON document_files FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_files.document_id
      AND documents.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own uploaded files"
  ON document_files FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

CREATE INDEX IF NOT EXISTS idx_document_files_document ON document_files(document_id);

-- =============================================
-- 6. DOCUMENT HISTORY
-- =============================================

CREATE TABLE IF NOT EXISTS document_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  old_status text,
  new_status text,
  performed_by uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  remarks text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE document_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view history for accessible documents"
  ON document_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_history.document_id
      AND (
        documents.created_by = auth.uid()
        OR documents.approver_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users_profile
          WHERE users_profile.id = auth.uid()
          AND users_profile.role IN ('Admin', 'Finance')
        )
      )
    )
  );

CREATE POLICY "System can insert history records"
  ON document_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = performed_by);

CREATE INDEX IF NOT EXISTS idx_document_history_document ON document_history(document_id);
CREATE INDEX IF NOT EXISTS idx_document_history_created ON document_history(created_at DESC);

-- =============================================
-- 7. STOCK BALANCES
-- =============================================

CREATE TABLE IF NOT EXISTS stock_balances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity_on_hand numeric(15,3) DEFAULT 0,
  reserved_quantity numeric(15,3) DEFAULT 0,
  last_movement_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, warehouse_id)
);

ALTER TABLE stock_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stock balances"
  ON stock_balances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authorized users can manage stock balances"
  ON stock_balances FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role IN ('Admin', 'Finance')
    )
  );

CREATE INDEX IF NOT EXISTS idx_stock_balances_product ON stock_balances(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_balances_warehouse ON stock_balances(warehouse_id);

-- =============================================
-- 8. STOCK MOVEMENTS
-- =============================================

CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE,
  movement_type text NOT NULL,
  quantity numeric(15,3) NOT NULL,
  unit_cost numeric(15,2),
  source_document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  reference_number text,
  remarks text,
  performed_by uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  movement_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stock movements"
  ON stock_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authorized users can create stock movements"
  ON stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = performed_by
    AND EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role IN ('Admin', 'Finance', 'Approver')
    )
  );

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_document ON stock_movements(source_document_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(movement_date DESC);

-- =============================================
-- 9. STORAGE SETUP FOR FILE UPLOADS
-- =============================================

-- Create storage bucket for document files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('document-files', 'document-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for document files
CREATE POLICY "Authenticated users can upload document files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'document-files'
  AND (
    -- Users can only upload to folders with their own user ID or document IDs they created
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id::text = (storage.foldername(name))[1]
      AND documents.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Authenticated users can view document files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'document-files');

CREATE POLICY "Authenticated users can update their own document files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'document-files'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id::text = (storage.foldername(name))[1]
      AND documents.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Authenticated users can delete their own document files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'document-files'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id::text = (storage.foldername(name))[1]
      AND documents.created_by = auth.uid()
    )
  )
);

-- =============================================
-- 10. SEED DATA (Initial Setup)
-- =============================================

-- Insert default warehouses
INSERT INTO warehouses (code, name, location, is_active) VALUES
  ('WH-MAIN', 'Main Warehouse', 'Building A, Floor 1', true),
  ('WH-SEC', 'Secondary Warehouse', 'Building B, Floor 2', true)
ON CONFLICT (code) DO NOTHING;

-- Insert default categories
INSERT INTO product_categories (code, name, description) VALUES
  ('RAW', 'Raw Materials', 'Raw materials and components'),
  ('FIN', 'Finished Goods', 'Finished products ready for sale'),
  ('PKG', 'Packaging', 'Packaging materials'),
  ('SUPP', 'Supplies', 'General supplies and consumables')
ON CONFLICT (code) DO NOTHING;

-- Insert sample products
INSERT INTO products (sku, name, description, category_id, unit_of_measure, cost_price, reorder_point, is_active) 
SELECT 
  'SKU-001',
  'Laptop Computer',
  'High-performance business laptop',
  (SELECT id FROM product_categories WHERE code = 'FIN'),
  'PCS',
  1200.00,
  5,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'SKU-001');

INSERT INTO products (sku, name, description, category_id, unit_of_measure, cost_price, reorder_point, is_active) 
SELECT 
  'SKU-002',
  'Wireless Mouse',
  'Ergonomic wireless mouse',
  (SELECT id FROM product_categories WHERE code = 'FIN'),
  'PCS',
  25.00,
  20,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'SKU-002');