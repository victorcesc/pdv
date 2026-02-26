import { invoke } from "@tauri-apps/api/tauri";
import type {
  Product,
  Customer,
  Sale,
  Payment,
  Invoice,
} from "../types";

// Product API
export async function createProduct(product: Product): Promise<number> {
  return invoke<number>("create_product", { product });
}

export async function getProduct(id: number): Promise<Product> {
  return invoke<Product>("get_product", { id });
}

export async function getProductByCode(code: string): Promise<Product | null> {
  return invoke<Product | null>("get_product_by_code", { code });
}

export async function listProducts(): Promise<Product[]> {
  return invoke<Product[]>("list_products");
}

export async function searchProducts(query: string): Promise<Product[]> {
  return invoke<Product[]>("search_products", { query });
}

export async function updateProduct(product: Product): Promise<number> {
  return invoke<number>("update_product", { product });
}

export async function deleteProduct(id: number): Promise<number> {
  return invoke<number>("delete_product", { id });
}

export async function listDeletedProducts(): Promise<Product[]> {
  return invoke<Product[]>("list_deleted_products");
}

export async function reactivateProduct(id: number): Promise<number> {
  return invoke<number>("reactivate_product", { id });
}

// Customer API
export async function createCustomer(customer: Customer): Promise<number> {
  return invoke<number>("create_customer", { customer });
}

export async function getCustomer(id: number): Promise<Customer> {
  return invoke<Customer>("get_customer", { id });
}

export async function getCustomerByDocument(
  document: string
): Promise<Customer | null> {
  return invoke<Customer | null>("get_customer_by_document", { document });
}

export async function listCustomers(): Promise<Customer[]> {
  return invoke<Customer[]>("list_customers");
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  return invoke<Customer[]>("search_customers", { query });
}

export async function updateCustomer(customer: Customer): Promise<number> {
  return invoke<number>("update_customer", { customer });
}

export async function deleteCustomer(id: number): Promise<number> {
  return invoke<number>("delete_customer", { id });
}

// Sale API
export async function createSale(sale: Sale): Promise<number> {
  return invoke<number>("create_sale", { sale });
}

export async function getSale(id: number): Promise<Sale> {
  return invoke<Sale>("get_sale", { id });
}

export async function listSales(): Promise<Sale[]> {
  return invoke<Sale[]>("list_sales");
}

export async function getPendingCreditSales(): Promise<Sale[]> {
  return invoke<Sale[]>("get_pending_credit_sales");
}

export async function getPendingCreditSalesByCustomer(
  customerId: number
): Promise<Sale[]> {
  return invoke<Sale[]>("get_pending_credit_sales_by_customer", { customerId });
}

export async function updateSale(sale: Sale): Promise<number> {
  return invoke<number>("update_sale", { sale });
}

// Payment API
export async function createPayment(payment: Payment): Promise<number> {
  return invoke<number>("create_payment", { payment });
}

export async function getPaymentsBySale(saleId: number): Promise<Payment[]> {
  return invoke<Payment[]>("get_payments_by_sale", { saleId });
}

export async function getSaleBalance(saleId: number): Promise<number> {
  return invoke<number>("get_sale_balance", { saleId });
}

export async function isSalePaid(saleId: number): Promise<boolean> {
  return invoke<boolean>("is_sale_paid", { saleId });
}

// Invoice API
export async function createInvoice(invoice: Invoice): Promise<number> {
  return invoke<number>("create_invoice", { invoice });
}

export async function getInvoice(id: number): Promise<Invoice> {
  return invoke<Invoice>("get_invoice", { id });
}

export async function getInvoiceByAccessKey(
  accessKey: string
): Promise<Invoice | null> {
  return invoke<Invoice | null>("get_invoice_by_access_key", { accessKey });
}

export async function updateInvoiceStatus(
  id: number,
  status: string
): Promise<number> {
  return invoke<number>("update_invoice_status", { id, status });
}
