use rusqlite::{Connection, Result, params};
use crate::models::Customer;
use chrono::{DateTime, Utc, FixedOffset};

fn parse_datetime(s: String) -> Option<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(&s)
        .ok()
        .map(|dt: DateTime<FixedOffset>| dt.with_timezone(&Utc))
}

pub struct CustomerRepository;

impl CustomerRepository {
    pub fn create(conn: &Connection, customer: &Customer) -> Result<i64> {
        conn.execute(
            "INSERT INTO customers (name, document, phone, email, address, active) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                customer.name,
                customer.document,
                customer.phone,
                customer.email,
                customer.address,
                customer.active
            ],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn find_by_id(conn: &Connection, id: i64) -> Result<Customer> {
        conn.query_row(
            "SELECT id, name, document, phone, email, address, active, created_at, updated_at 
             FROM customers WHERE id = ?1",
            params![id],
            |row| {
                Ok(Customer {
                    id: Some(row.get(0)?),
                    name: row.get(1)?,
                    document: row.get(2)?,
                    phone: row.get(3)?,
                    email: row.get(4)?,
                    address: row.get(5)?,
                    active: row.get(6)?,
                    created_at: row.get::<_, Option<String>>(7)?
                        .and_then(parse_datetime),
                    updated_at: row.get::<_, Option<String>>(8)?
                        .and_then(parse_datetime),
                })
            },
        )
    }

    pub fn find_by_document(conn: &Connection, document: &str) -> Result<Option<Customer>> {
        let mut stmt = conn.prepare(
            "SELECT id, name, document, phone, email, address, active, created_at, updated_at 
             FROM customers WHERE document = ?1"
        )?;
        let mut rows = stmt.query_map(params![document], |row| {
            Ok(Customer {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                document: row.get(2)?,
                phone: row.get(3)?,
                email: row.get(4)?,
                address: row.get(5)?,
                active: row.get(6)?,
                created_at: row.get::<_, Option<String>>(7)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc)),
                updated_at: row.get::<_, Option<String>>(8)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc)),
            })
        })?;
        
        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    pub fn list_all(conn: &Connection) -> Result<Vec<Customer>> {
        let mut stmt = conn.prepare(
            "SELECT id, name, document, phone, email, address, active, created_at, updated_at 
             FROM customers WHERE active = 1 ORDER BY name"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Customer {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                document: row.get(2)?,
                phone: row.get(3)?,
                email: row.get(4)?,
                address: row.get(5)?,
                active: row.get(6)?,
                created_at: row.get::<_, Option<String>>(7)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc)),
                updated_at: row.get::<_, Option<String>>(8)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc)),
            })
        })?;
        
        let mut customers = Vec::new();
        for row in rows {
            customers.push(row?);
        }
        Ok(customers)
    }

    pub fn update(conn: &Connection, customer: &Customer) -> Result<usize> {
        conn.execute(
            "UPDATE customers SET name = ?1, document = ?2, phone = ?3, email = ?4, 
             address = ?5, active = ?6 WHERE id = ?7",
            params![
                customer.name,
                customer.document,
                customer.phone,
                customer.email,
                customer.address,
                customer.active,
                customer.id
            ],
        )
    }

    pub fn delete(conn: &Connection, id: i64) -> Result<usize> {
        conn.execute("UPDATE customers SET active = 0 WHERE id = ?1", params![id])
    }

    pub fn search(conn: &Connection, query: &str) -> Result<Vec<Customer>> {
        let search_term = format!("%{}%", query);
        let mut stmt = conn.prepare(
            "SELECT id, name, document, phone, email, address, active, created_at, updated_at 
             FROM customers WHERE active = 1 AND (name LIKE ?1 OR document LIKE ?1) ORDER BY name"
        )?;
        let rows = stmt.query_map(params![search_term], |row| {
            Ok(Customer {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                document: row.get(2)?,
                phone: row.get(3)?,
                email: row.get(4)?,
                address: row.get(5)?,
                active: row.get(6)?,
                created_at: row.get::<_, Option<String>>(7)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc)),
                updated_at: row.get::<_, Option<String>>(8)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc)),
            })
        })?;
        
        let mut customers = Vec::new();
        for row in rows {
            customers.push(row?);
        }
        Ok(customers)
    }
}

