use rusqlite::Connection;
use crate::models::{Sale, sale_item::SaleItem, Invoice, invoice_item::InvoiceItem};
use crate::repositories::{SaleRepository, ProductRepository, InvoiceRepository};
use crate::services::InvoiceService;
use anyhow::Result;
use chrono::Utc;

pub struct SaleService;

impl SaleService {
    pub fn create(conn: &mut Connection, sale: &mut Sale) -> Result<i64> {
        // Validate items
        if sale.items.is_none() || sale.items.as_ref().unwrap().is_empty() {
            return Err(anyhow::anyhow!("Sale must have at least one item"));
        }

        // Calculate total from items
        let total: f64 = sale.items.as_ref().unwrap()
            .iter()
            .map(|item| item.subtotal)
            .sum();

        sale.total = total;

        // Validate total
        if sale.total <= 0.0 {
            return Err(anyhow::anyhow!("Sale total must be greater than zero"));
        }

        // Validate products exist
        for item in sale.items.as_ref().unwrap() {
            ProductRepository::find_by_id(conn, item.product_id)
                .map_err(|_| anyhow::anyhow!("Product with id {} not found", item.product_id))?;
        }

        // If credit sale, ensure generate_invoice is false
        if sale.is_credit {
            sale.generate_invoice = false;
        }

        // Create sale
        let sale_id = SaleRepository::create(conn, sale)?;

        // Se a venda deve gerar nota fiscal, criar automaticamente em modo "pending"
        // Isso permite trabalho offline - a nota será processada quando houver internet
        if sale.generate_invoice && !sale.is_credit {
            eprintln!("[SALE_SERVICE] Criando nota fiscal pendente para venda {}", sale_id);
            
            let mut invoice = Invoice::new(sale_id);
            
            // Gerar número provisório local (será substituído quando processado)
            // Formato: LOCAL-{timestamp}-{sale_id}
            let provisional_number = format!("LOCAL-{}-{}", 
                Utc::now().timestamp(), 
                sale_id
            );
            invoice.invoice_number = Some(provisional_number);
            
            // Converter itens da venda em itens da nota fiscal
            if let Some(sale_items) = &sale.items {
                let invoice_items: Vec<InvoiceItem> = sale_items
                    .iter()
                    .map(|item| InvoiceItem {
                        id: None,
                        invoice_id: None,
                        product_id: item.product_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        subtotal: item.subtotal,
                    })
                    .collect();
                invoice.items = Some(invoice_items);
            }
            
            // Criar nota fiscal com status "pending"
            match InvoiceService::create(conn, &mut invoice) {
                Ok(invoice_id) => {
                    eprintln!("[SALE_SERVICE] ✅ Nota fiscal pendente criada com ID: {}", invoice_id);
                }
                Err(e) => {
                    // Não falha a venda se a nota fiscal não puder ser criada
                    // A nota pode ser criada manualmente depois
                    eprintln!("[SALE_SERVICE] ⚠️  Aviso: Não foi possível criar nota fiscal pendente: {}", e);
                }
            }
        }

        Ok(sale_id)
    }

    pub fn calculate_total(items: &[SaleItem]) -> f64 {
        items.iter().map(|item| item.subtotal).sum()
    }

    pub fn validate_items(conn: &Connection, items: &[SaleItem]) -> Result<()> {
        for item in items {
            if item.quantity <= 0 {
                return Err(anyhow::anyhow!("Item quantity must be greater than zero"));
            }
            if item.unit_price < 0.0 {
                return Err(anyhow::anyhow!("Item unit price cannot be negative"));
            }
            
            // Check if product exists
            ProductRepository::find_by_id(conn, item.product_id)
                .map_err(|_| anyhow::anyhow!("Product with id {} not found", item.product_id))?;
        }
        Ok(())
    }
}

