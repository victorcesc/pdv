// Tipos compartilhados entre desktop e API
export interface User {
    id: number;
    email: string;
    name: string;
  }
  
  export interface RegisterCredentials {
    email: string;
    password: string;
    name: string;
    registrationKey: string;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface AuthResponse {
    token: string;
    user: User;
  }
  
  export interface Sale {
    id?: number;
    customer_id?: number;
    sale_date: string;
    total: number;
    payment_method: string;
    is_credit: boolean;
    generate_invoice: boolean;
    status: string;
    items?: SaleItem[];
  }
  
  export interface SaleItem {
    id?: number;
    sale_id?: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }