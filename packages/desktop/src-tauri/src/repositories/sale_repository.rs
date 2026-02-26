use rusqlite::{Connection, Result, params};
use crate::models::{Sale, sale_item::SaleItem};
use chrono::{DateTime, Utc, FixedOffset};

fn parse_datetime(s: String) -> Option<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(&s)
        .ok()
        .map(|dt: DateTime<FixedOffset>| dt.with_timezone(&Utc))
}

pub struct SaleRepository;

impl SaleRepository {
    pub fn create(conn: &mut Connection, sale: &mut Sale) -> Result<i64> {
        let tx = conn.transaction()?;
        
        // Insert sale
        tx.execute(
            "INSERT INTO sales (customer_id, sale_date, total, payment_method, is_credit, 
             generate_invoice, status, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                sale.customer_id,
                sale.sale_date.to_rfc3339(),
                sale.total,
                sale.payment_method,
                sale.is_credit,
                sale.generate_invoice,
                sale.status,
                sale.notes
            ],
        )?;
        let sale_id = tx.last_insert_rowid();
        sale.id = Some(sale_id);

        // Insert sale items
        if let Some(items) = &sale.items {
            for item in items {
                tx.execute(
                    "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) 
                     VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![sale_id, item.product_id, item.quantity, item.unit_price, item.subtotal],
                )?;
            }
        }

        tx.commit()?;
        Ok(sale_id)
    }

    pub fn find_by_id(conn: &Connection, id: i64) -> Result<Sale> {
        let sale = conn.query_row(
            "SELECT id, customer_id, sale_date, total, payment_method, is_credit, 
             generate_invoice, status, notes, created_at, updated_at 
             FROM sales WHERE id = ?1",
            params![id],
            |row| {
                Ok(Sale {
                    id: Some(row.get(0)?),
                    customer_id: row.get(1)?,
                    customer_name: None,
                    sale_date: parse_datetime(row.get::<_, String>(2)?)
                        .unwrap_or_else(Utc::now),
                    total: row.get(3)?,
                    payment_method: row.get(4)?,
                    is_credit: row.get(5)?,
                    generate_invoice: row.get(6)?,
                    status: row.get(7)?,
                    notes: row.get(8)?,
                    created_at: row.get::<_, Option<String>>(9)?
                        .and_then(parse_datetime),
                    updated_at: row.get::<_, Option<String>>(10)?
                        .and_then(parse_datetime),
                    items: None,
                })
            },
        )?;

        // Load items
        let items = Self::find_items_by_sale_id(conn, id)?;
        Ok(Sale { items: Some(items), ..sale })
    }

    pub fn find_items_by_sale_id(conn: &Connection, sale_id: i64) -> Result<Vec<SaleItem>> {
        let mut stmt = conn.prepare(
            "SELECT id, sale_id, product_id, quantity, unit_price, subtotal 
             FROM sale_items WHERE sale_id = ?1"
        )?;
        let rows = stmt.query_map(params![sale_id], |row| {
            Ok(SaleItem {
                id: Some(row.get(0)?),
                sale_id: Some(row.get(1)?),
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

    pub fn list_all(conn: &Connection) -> Result<Vec<Sale>> {
        let mut stmt = conn.prepare(
            "SELECT id, customer_id, sale_date, total, payment_method, is_credit, 
             generate_invoice, status, notes, created_at, updated_at 
             FROM sales ORDER BY sale_date DESC"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Sale {
                id: Some(row.get(0)?),
                customer_id: row.get(1)?,
                customer_name: None,
                sale_date: parse_datetime(row.get::<_, String>(2)?)
                    .unwrap_or_else(Utc::now),
                total: row.get(3)?,
                payment_method: row.get(4)?,
                is_credit: row.get(5)?,
                generate_invoice: row.get(6)?,
                status: row.get(7)?,
                notes: row.get(8)?,
                created_at: row.get::<_, Option<String>>(9)?
                    .and_then(parse_datetime),
                updated_at: row.get::<_, Option<String>>(10)?
                    .and_then(parse_datetime),
                items: None,
            })
        })?;
        
        let mut sales = Vec::new();
        for row in rows {
            sales.push(row?);
        }
        Ok(sales)
    }

    pub fn find_pending_credit_sales(conn: &Connection) -> Result<Vec<Sale>> {
        let mut stmt = conn.prepare(
            "SELECT s.id, s.customer_id, s.sale_date, s.total, s.payment_method, s.is_credit, 
             s.generate_invoice, s.status, s.notes, s.created_at, s.updated_at, c.name
             FROM sales s
             LEFT JOIN customers c ON s.customer_id = c.id
             LEFT JOIN (
                 SELECT sale_id, SUM(amount) as total_paid
                 FROM payments
                 GROUP BY sale_id
             ) p ON s.id = p.sale_id
             WHERE s.is_credit = 1 AND s.status = 'completed'
             AND (p.total_paid IS NULL OR p.total_paid < s.total)
             ORDER BY s.sale_date DESC"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Sale {
                id: Some(row.get(0)?),
                customer_id: row.get(1)?,
                customer_name: row.get(11)?,
                sale_date: parse_datetime(row.get::<_, String>(2)?)
                    .unwrap_or_else(Utc::now),
                total: row.get(3)?,
                payment_method: row.get(4)?,
                is_credit: row.get(5)?,
                generate_invoice: row.get(6)?,
                status: row.get(7)?,
                notes: row.get(8)?,
                created_at: row.get::<_, Option<String>>(9)?
                    .and_then(parse_datetime),
                updated_at: row.get::<_, Option<String>>(10)?
                    .and_then(parse_datetime),
                items: None,
            })
        })?;
        
        let mut sales = Vec::new();
        for row in rows {
            sales.push(row?);
        }
        Ok(sales)
    }

    pub fn find_pending_credit_sales_by_customer(conn: &Connection, customer_id: i64) -> Result<Vec<Sale>> {
        let mut stmt = conn.prepare(
            "SELECT s.id, s.customer_id, s.sale_date, s.total, s.payment_method, s.is_credit, 
             s.generate_invoice, s.status, s.notes, s.created_at, s.updated_at, c.name
             FROM sales s
             LEFT JOIN customers c ON s.customer_id = c.id
             LEFT JOIN (
                 SELECT sale_id, SUM(amount) as total_paid
                 FROM payments
                 GROUP BY sale_id
             ) p ON s.id = p.sale_id
             WHERE s.is_credit = 1 AND s.status = 'completed'
             AND s.customer_id = ?1
             AND (p.total_paid IS NULL OR p.total_paid < s.total)
             ORDER BY s.sale_date DESC"
        )?;
        let rows = stmt.query_map(params![customer_id], |row| {
            Ok(Sale {
                id: Some(row.get(0)?),
                customer_id: row.get(1)?,
                customer_name: row.get(11)?,
                sale_date: parse_datetime(row.get::<_, String>(2)?)
                    .unwrap_or_else(Utc::now),
                total: row.get(3)?,
                payment_method: row.get(4)?,
                is_credit: row.get(5)?,
                generate_invoice: row.get(6)?,
                status: row.get(7)?,
                notes: row.get(8)?,
                created_at: row.get::<_, Option<String>>(9)?
                    .and_then(parse_datetime),
                updated_at: row.get::<_, Option<String>>(10)?
                    .and_then(parse_datetime),
                items: None,
            })
        })?;
        
        let mut sales = Vec::new();
        for row in rows {
            sales.push(row?);
        }
        Ok(sales)
    }

    pub fn update(conn: &Connection, sale: &Sale) -> Result<usize> {
        conn.execute(
            "UPDATE sales SET customer_id = ?1, total = ?2, payment_method = ?3, 
             is_credit = ?4, generate_invoice = ?5, status = ?6, notes = ?7 
             WHERE id = ?8",
            params![
                sale.customer_id,
                sale.total,
                sale.payment_method,
                sale.is_credit,
                sale.generate_invoice,
                sale.status,
                sale.notes,
                sale.id
            ],
        )
    }
}

