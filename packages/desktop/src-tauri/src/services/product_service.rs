use rusqlite::Connection;
use crate::models::Product;
use crate::repositories::ProductRepository;
use anyhow::Result;

pub struct ProductService;

impl ProductService {
    pub fn create(conn: &Connection, product: &Product) -> Result<i64> {
        // Validate price
        if product.price < 0.0 {
            return Err(anyhow::anyhow!("PRICE_CANNOT_BE_NEGATIVE"));
        }
        if product.price == 0.0 {
            return Err(anyhow::anyhow!("PRICE_CANNOT_BE_ZERO"));
        }

        // Validate code is not empty
        if product.code.trim().is_empty() {
            return Err(anyhow::anyhow!("PRODUCT_CODE_CANNOT_BE_EMPTY"));
        }

        // Check if code already exists (including inactive products)
        if let Some(existing) = ProductRepository::find_by_code_any(conn, &product.code)? {
            if !existing.active {
                return Err(anyhow::anyhow!("PRODUCT_CODE_EXISTS_INACTIVE"));
            }
            return Err(anyhow::anyhow!("PRODUCT_CODE_ALREADY_EXISTS"));
        }

        Ok(ProductRepository::create(conn, product)?)
    }

    pub fn update(conn: &Connection, product: &Product) -> Result<usize> {
        if product.price < 0.0 {
            return Err(anyhow::anyhow!("PRICE_CANNOT_BE_NEGATIVE"));
        }
        if product.price == 0.0 {
            return Err(anyhow::anyhow!("PRICE_CANNOT_BE_ZERO"));
        }

        if product.code.trim().is_empty() {
            return Err(anyhow::anyhow!("PRODUCT_CODE_CANNOT_BE_EMPTY"));
        }

        // Check if code exists for another product (including inactive)
        if let Some(existing) = ProductRepository::find_by_code_any(conn, &product.code)? {
            if existing.id != product.id {
                if !existing.active {
                    return Err(anyhow::anyhow!("PRODUCT_CODE_EXISTS_INACTIVE"));
                }
                return Err(anyhow::anyhow!("PRODUCT_CODE_ALREADY_IN_USE"));
            }
        }

        Ok(ProductRepository::update(conn, product)?)
    }

    pub fn delete(conn: &Connection, id: i64) -> Result<usize> {
        Ok(ProductRepository::delete(conn, id)?)
    }
}

