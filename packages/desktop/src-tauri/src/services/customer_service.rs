use rusqlite::Connection;
use crate::models::Customer;
use crate::repositories::CustomerRepository;
use anyhow::Result;

pub struct CustomerService;

impl CustomerService {
    pub fn create(conn: &Connection, customer: &Customer) -> Result<i64> {
        // Validate name is not empty
        if customer.name.trim().is_empty() {
            return Err(anyhow::anyhow!("Customer name cannot be empty"));
        }

        // Check if document already exists (if provided)
        if let Some(ref doc) = customer.document {
            if !doc.trim().is_empty() {
                if let Some(_) = CustomerRepository::find_by_document(conn, doc)? {
                    return Err(anyhow::anyhow!("Customer with document {} already exists", doc));
                }
            }
        }

        Ok(CustomerRepository::create(conn, customer)?)
    }

    pub fn update(conn: &Connection, customer: &Customer) -> Result<usize> {
        if customer.name.trim().is_empty() {
            return Err(anyhow::anyhow!("Customer name cannot be empty"));
        }

        // Check if document exists for another customer
        if let Some(ref doc) = customer.document {
            if !doc.trim().is_empty() {
                if let Some(existing) = CustomerRepository::find_by_document(conn, doc)? {
                    if existing.id != customer.id {
                        return Err(anyhow::anyhow!("Document already in use"));
                    }
                }
            }
        }

        Ok(CustomerRepository::update(conn, customer)?)
    }

    pub fn delete(conn: &Connection, id: i64) -> Result<usize> {
        Ok(CustomerRepository::delete(conn, id)?)
    }
}

