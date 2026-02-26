use rusqlite::{Connection, Result, params};
use crate::models::{Invoice, invoice_item::InvoiceItem};
use chrono::{DateTime, Utc, FixedOffset};

fn parse_datetime(s: String) -> Option<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(&s)
        .ok()
        .map(|dt: DateTime<FixedOffset>| dt.with_timezone(&Utc))
}

pub struct InvoiceRepository;

impl InvoiceRepository {
    pub fn create(conn: &mut Connection, invoice: &mut Invoice) -> Result<i64> {
        let tx = conn.transaction()?;
        
        tx.execute(
            "INSERT INTO invoices (sale_id, invoice_number, access_key, issue_date, status, xml_content) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                invoice.sale_id,
                invoice.invoice_number,
                invoice.access_key,
                invoice.issue_date.to_rfc3339(),
                invoice.status,
                invoice.xml_content
            ],
        )?;
        let invoice_id = tx.last_insert_rowid();
        invoice.id = Some(invoice_id);

        if let Some(items) = &invoice.items {
            for item in items {
                tx.execute(
                    "INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, subtotal) 
                     VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![invoice_id, item.product_id, item.quantity, item.unit_price, item.subtotal],
                )?;
            }
        }

        tx.commit()?;
        Ok(invoice_id)
    }

    pub fn find_by_id(conn: &Connection, id: i64) -> Result<Invoice> {
        let invoice = conn.query_row(
            "SELECT id, sale_id, invoice_number, access_key, issue_date, status, xml_content, 
             created_at, updated_at FROM invoices WHERE id = ?1",
            params![id],
            |row| {
                Ok(Invoice {
                    id: Some(row.get(0)?),
                    sale_id: row.get(1)?,
                    invoice_number: row.get(2)?,
                    access_key: row.get(3)?,
                    issue_date: parse_datetime(row.get::<_, String>(4)?)
                        .unwrap_or_else(Utc::now),
                    status: row.get(5)?,
                    xml_content: row.get(6)?,
                    created_at: row.get::<_, Option<String>>(7)?
                        .and_then(parse_datetime),
                    updated_at: row.get::<_, Option<String>>(8)?
                        .and_then(parse_datetime),
                    items: None,
                })
            },
        )?;

        let items = Self::find_items_by_invoice_id(conn, id)?;
        Ok(Invoice { items: Some(items), ..invoice })
    }

    pub fn find_by_access_key(conn: &Connection, access_key: &str) -> Result<Option<Invoice>> {
        let mut stmt = conn.prepare(
            "SELECT id, sale_id, invoice_number, access_key, issue_date, status, xml_content, 
             created_at, updated_at FROM invoices WHERE access_key = ?1"
        )?;
        let mut rows = stmt.query_map(params![access_key], |row| {
            Ok(Invoice {
                id: Some(row.get(0)?),
                sale_id: row.get(1)?,
                invoice_number: row.get(2)?,
                access_key: row.get(3)?,
                issue_date: parse_datetime(row.get::<_, String>(4)?)
                    .unwrap_or_else(Utc::now),
                status: row.get(5)?,
                xml_content: row.get(6)?,
                created_at: row.get::<_, Option<String>>(7)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc)),
                updated_at: row.get::<_, Option<String>>(8)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc)),
                items: None,
            })
        })?;
        
        match rows.next() {
            Some(row) => {
                let mut invoice = row?;
                let items = Self::find_items_by_invoice_id(conn, invoice.id.unwrap())?;
                invoice.items = Some(items);
                Ok(Some(invoice))
            },
            None => Ok(None),
        }
    }

    pub fn find_items_by_invoice_id(conn: &Connection, invoice_id: i64) -> Result<Vec<InvoiceItem>> {
        let mut stmt = conn.prepare(
            "SELECT id, invoice_id, product_id, quantity, unit_price, subtotal 
             FROM invoice_items WHERE invoice_id = ?1"
        )?;
        let rows = stmt.query_map(params![invoice_id], |row| {
            Ok(InvoiceItem {
                id: Some(row.get(0)?),
                invoice_id: Some(row.get(1)?),
                product_id: row.get(2)?,
                quantity: row.get(3)?,
                unit_price: row.get(4)?,
                subtotal: row.get(5)?,
            })
        })?;
        
        let mut items = Vec::new();
        for row in rows {
            items.push(row?);
        }
        Ok(items)
    }

    pub fn update_status(conn: &Connection, id: i64, status: &str) -> Result<usize> {
        conn.execute(
            "UPDATE invoices SET status = ?1 WHERE id = ?2",
            params![status, id],
        )
    }
}

