// Database Models
export interface Customer {
  id?: number;
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id?: number;
  code: string;
  name: string;
  price: number;
  description?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SaleItem {
  id?: number;
  sale_id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Sale {
  id?: number;
  customer_id?: number;
  customer_name?: string;
  sale_date: string;
  total: number;
  payment_method: string;
  is_credit: boolean;
  generate_invoice: boolean;
  status: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  items?: SaleItem[];
}

export interface Payment {
  id?: number;
  sale_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes?: string;
  created_at?: string;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Invoice {
  id?: number;
  sale_id: number;
  invoice_number?: string;
  access_key?: string;
  issue_date: string;
  status: string;
  xml_content?: string;
  created_at?: string;
  updated_at?: string;
  items?: InvoiceItem[];
}

export interface SyncLog {
  id?: number;
  entity_type: string;
  entity_id: number;
  action: string;
  payload_json?: string;
  synced: boolean;
  sync_date?: string;
  error_message?: string;
  created_at?: string;
}

// Component Props
export interface ProductSearchProps {
  onSelectProduct: (product: Product) => void;
}

export interface CustomerSearchProps {
  onSelectCustomer: (customer: Customer | null) => void;
  selectedCustomer?: Customer | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface CartProps {
  items: CartItem[];
  onRemove: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  total: number;
  onFinalize: () => void;
}

export interface LayoutProps {
  children: React.ReactNode;
}

// Form Data Types
export interface ProductFormData {
  code: string;
  name: string;
  price: string;
  description: string;
}

export interface CustomerFormData {
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
}

// API Response Types
export type ApiResult<T> = T;
export type ApiError = string;

