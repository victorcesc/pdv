use rusqlite::Connection;
use crate::models::{Sale, sale_item::SaleItem};
use crate::repositories::{SaleRepository, ProductRepository};
use anyhow::Result;

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

        Ok(SaleRepository::create(conn, sale)?)
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

