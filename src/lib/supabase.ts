import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users_profile: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          department: string;
          role: string;
          avatar_url: string | null;
          created_at: string;
        };
      };
      documents: {
        Row: {
          id: string;
          document_type: string;
          document_number: string;
          supplier_name: string;
          document_date: string;
          document_value: number;
          currency: string;
          status: string;
          priority: string;
          approver_id: string | null;
          created_by: string | null;
          remarks: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      products: {
        Row: {
          id: string;
          sku: string;
          name: string;
          description: string | null;
          category_id: string | null;
          unit_of_measure: string;
          cost_price: number;
          reorder_point: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      stock_balances: {
        Row: {
          id: string;
          product_id: string;
          warehouse_id: string;
          quantity_on_hand: number;
          reserved_quantity: number;
          last_movement_at: string | null;
          updated_at: string;
        };
      };
      stock_movements: {
        Row: {
          id: string;
          product_id: string;
          warehouse_id: string;
          movement_type: string;
          quantity: number;
          unit_cost: number | null;
          source_document_id: string | null;
          reference_number: string | null;
          remarks: string | null;
          performed_by: string | null;
          movement_date: string;
          created_at: string;
        };
      };
    };
  };
};
