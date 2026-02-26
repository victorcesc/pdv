use rusqlite::{Connection, Result, params};
use crate::models::Product;
use chrono::{DateTime, Utc, FixedOffset};

fn parse_datetime(s: String) -> Option<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(&s)
        .ok()
        .map(|dt: DateTime<FixedOffset>| dt.with_timezone(&Utc))
}

pub struct ProductRepository;

impl ProductRepository {
    pub fn create(conn: &Connection, product: &Product) -> Result<i64> {
        conn.execute(
            "INSERT INTO products (code, name, price, description, active) 
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                product.code,
                product.name,
                product.price,
                product.description,
                product.active
            ],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn find_by_id(conn: &Connection, id: i64) -> Result<Product> {
        conn.query_row(
            "SELECT id, code, name, price, description, active, created_at, updated_at 
             FROM products WHERE id = ?1",
            params![id],
            |row| {
                Ok(Product {
                    id: Some(row.get(0)?),
                    code: row.get(1)?,
                    name: row.get(2)?,
                    price: row.get(3)?,
                    description: row.get(4)?,
                    active: row.get(5)?,
                    created_at: row.get::<_, Option<String>>(6)?
                        .and_then(parse_datetime),
                    updated_at: row.get::<_, Option<String>>(7)?
                        .and_then(parse_datetime),
                })
            },
        )
    }

    pub fn find_by_code(conn: &Connection, code: &str) -> Result<Option<Product>> {
        let mut stmt = conn.prepare(
            "SELECT id, code, name, price, description, active, created_at, updated_at 
             FROM products WHERE code = ?1 AND active = 1"
        )?;
        let mut rows = stmt.query_map(params![code], |row| {
            Ok(Product {
                id: Some(row.get(0)?),
                code: row.get(1)?,
                name: row.get(2)?,
                price: row.get(3)?,
                description: row.get(4)?,
                active: row.get(5)?,
                created_at: row.get::<_, Option<String>>(6)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc)),
                updated_at: row.get::<_, Option<String>>(7)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc)),
            })
        })?;
        
        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    pub fn find_by_code_any(conn: &Connection, code: &str) -> Result<Option<Product>> {
        let mut stmt = conn.prepare(
            "SELECT id, code, name, price, description, active, created_at, updated_at 
             FROM products WHERE code = ?1"
        )?;
        let mut rows = stmt.query_map(params![code], |row| {
            Ok(Product {
                id: Some(row.get(0)?),
                code: row.get(1)?,
                name: row.get(2)?,
                price: row.get(3)?,
                description: row.get(4)?,
                active: row.get(5)?,
                created_at: row.get::<_, Option<String>>(6)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc)),
                updated_at: row.get::<_, Option<String>>(7)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc)),
            })
        })?;
        
        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    pub fn list_all(conn: &Connection) -> Result<Vec<Product>> {
        let mut stmt = conn.prepare(
            "SELECT id, code, name, price, description, active, created_at, updated_at 
             FROM products WHERE active = 1 ORDER BY name"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Product {
                id: Some(row.get(0)?),
                code: row.get(1)?,
                name: row.get(2)?,
                price: row.get(3)?,
                description: row.get(4)?,
                active: row.get(5)?,
                created_at: row.get::<_, Option<String>>(6)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc)),
                updated_at: row.get::<_, Option<String>>(7)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc)),
            })
        })?;
        
        let mut products = Vec::new();
        for row in rows {
            products.push(row?);
        }
        Ok(products)
    }

    pub fn search(conn: &Connection, query: &str) -> Result<Vec<Product>> {
        let search_term = format!("%{}%", query);
        let mut stmt = conn.prepare(
            "SELECT id, code, name, price, description, active, created_at, updated_at 
             FROM products WHERE active = 1 AND (name LIKE ?1 OR code LIKE ?1) ORDER BY name"
        )?;
        let rows = stmt.query_map(params![search_term], |row| {
            Ok(Product {
                id: Some(row.get(0)?),
                code: row.get(1)?,
                name: row.get(2)?,
                price: row.get(3)?,
                description: row.get(4)?,
                active: row.get(5)?,
                created_at: row.get::<_, Option<String>>(6)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc)),
                updated_at: row.get::<_, Option<String>>(7)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc)),
            })
        })?;
        
        let mut products = Vec::new();
        for row in rows {
            products.push(row?);
        }
        Ok(products)
    }

    pub fn update(conn: &Connection, product: &Product) -> Result<usize> {
        conn.execute(
            "UPDATE products SET code = ?1, name = ?2, price = ?3, description = ?4, 
             active = ?5 WHERE id = ?6",
            params![
                product.code,
                product.name,
                product.price,
                product.description,
                product.active,
                product.id
            ],
        )
    }

    pub fn delete(conn: &Connection, id: i64) -> Result<usize> {
        conn.execute("UPDATE products SET active = 0 WHERE id = ?1", params![id])
    }

    pub fn list_deleted(conn: &Connection) -> Result<Vec<Product>> {
        let mut stmt = conn.prepare(
            "SELECT id, code, name, price, description, active, created_at, updated_at 
             FROM products WHERE active = 0 ORDER BY name"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Product {
                id: Some(row.get(0)?),
                code: row.get(1)?,
                name: row.get(2)?,
                price: row.get(3)?,
                description: row.get(4)?,
                active: row.get(5)?,
                created_at: row.get::<_, Option<String>>(6)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc)),
                updated_at: row.get::<_, Option<String>>(7)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc)),
            })
        })?;
        
        let mut products = Vec::new();
        for row in rows {
            products.push(row?);
        }
        Ok(products)
    }

    pub fn reactivate(conn: &Connection, id: i64) -> Result<usize> {
        conn.execute("UPDATE products SET active = 1 WHERE id = ?1", params![id])
    }
}

