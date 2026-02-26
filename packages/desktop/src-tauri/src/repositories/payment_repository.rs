use rusqlite::{Connection, Result, params};
use crate::models::Payment;
use chrono::{DateTime, Utc, FixedOffset};

fn parse_datetime(s: String) -> Option<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(&s)
        .ok()
        .map(|dt: DateTime<FixedOffset>| dt.with_timezone(&Utc))
}

pub struct PaymentRepository;

impl PaymentRepository {
    pub fn create(conn: &Connection, payment: &Payment) -> Result<i64> {
        conn.execute(
            "INSERT INTO payments (sale_id, amount, payment_date, payment_method, notes) 
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                payment.sale_id,
                payment.amount,
                payment.payment_date.to_rfc3339(),
                payment.payment_method,
                payment.notes
            ],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn find_by_id(conn: &Connection, id: i64) -> Result<Payment> {
        conn.query_row(
            "SELECT id, sale_id, amount, payment_date, payment_method, notes, created_at 
             FROM payments WHERE id = ?1",
            params![id],
            |row| {
                Ok(Payment {
                    id: Some(row.get(0)?),
                    sale_id: row.get(1)?,
                    amount: row.get(2)?,
                    payment_date: parse_datetime(row.get::<_, String>(3)?)
                        .unwrap_or_else(Utc::now),
                    payment_method: row.get(4)?,
                    notes: row.get(5)?,
                    created_at: row.get::<_, Option<String>>(6)?
                        .and_then(parse_datetime),
                })
            },
        )
    }

    pub fn find_by_sale_id(conn: &Connection, sale_id: i64) -> Result<Vec<Payment>> {
        let mut stmt = conn.prepare(
            "SELECT id, sale_id, amount, payment_date, payment_method, notes, created_at 
             FROM payments WHERE sale_id = ?1 ORDER BY payment_date DESC"
        )?;
        let rows = stmt.query_map(params![sale_id], |row| {
            Ok(Payment {
                id: Some(row.get(0)?),
                sale_id: row.get(1)?,
                amount: row.get(2)?,
                payment_date: parse_datetime(row.get::<_, String>(3)?)
                    .unwrap_or_else(Utc::now),
                payment_method: row.get(4)?,
                notes: row.get(5)?,
                created_at: row.get::<_, Option<String>>(6)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc)),
            })
        })?;
        
        let mut payments = Vec::new();
        for row in rows {
            payments.push(row?);
        }
        Ok(payments)
    }

    pub fn calculate_balance(conn: &Connection, sale_id: i64) -> Result<f64> {
        let sale_total: f64 = conn.query_row(
            "SELECT total FROM sales WHERE id = ?1",
            params![sale_id],
            |row| row.get(0),
        )?;

        let total_paid: f64 = conn.query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE sale_id = ?1",
            params![sale_id],
            |row| row.get(0),
        ).unwrap_or(0.0);

        Ok(sale_total - total_paid)
    }
}

