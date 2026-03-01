use rusqlite::Connection;
use crate::models::Invoice;
use crate::repositories::{InvoiceRepository, SaleRepository};
use anyhow::Result;

pub struct InvoiceService;

impl InvoiceService {
    pub fn create(conn: &mut Connection, invoice: &mut Invoice) -> Result<i64> {
        // Validate sale exists
        let sale = SaleRepository::find_by_id(conn, invoice.sale_id)
            .map_err(|_| anyhow::anyhow!("Sale with id {} not found", invoice.sale_id))?;

        // Validate sale should generate invoice
        if !sale.generate_invoice {
            return Err(anyhow::anyhow!("Sale is not configured to generate invoice"));
        }

        // Validate sale is not credit
        if sale.is_credit {
            return Err(anyhow::anyhow!("Credit sales cannot generate invoices"));
        }

        Ok(InvoiceRepository::create(conn, invoice)?)
    }

    pub fn update_status(conn: &Connection, id: i64, status: &str) -> Result<usize> {
        let valid_statuses = vec!["pending", "issued", "cancelled", "error"];
        if !valid_statuses.contains(&status) {
            return Err(anyhow::anyhow!("Invalid invoice status: {}", status));
        }

        Ok(InvoiceRepository::update_status(conn, id, status)?)
    }

    pub fn update_invoice_data(
        conn: &Connection,
        id: i64,
        invoice_number: Option<&str>,
        access_key: Option<&str>,
        xml_content: Option<&str>,
        status: &str,
    ) -> Result<usize> {
        let valid_statuses = vec!["pending", "issued", "cancelled", "error"];
        if !valid_statuses.contains(&status) {
            return Err(anyhow::anyhow!("Invalid invoice status: {}", status));
        }

        Ok(InvoiceRepository::update_invoice_data(
            conn, id, invoice_number, access_key, xml_content, status
        )?)
    }
}

