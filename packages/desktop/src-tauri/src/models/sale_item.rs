use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaleItem {
    pub id: Option<i64>,
    pub sale_id: Option<i64>,
    pub product_id: i64,
    pub quantity: i32,
    pub unit_price: f64,
    pub subtotal: f64,
}

impl SaleItem {
    pub fn new(product_id: i64, quantity: i32, unit_price: f64) -> Self {
        let subtotal = quantity as f64 * unit_price;
        Self {
            id: None,
            sale_id: None,
            product_id,
            quantity,
            unit_price,
            subtotal,
        }
    }
}

