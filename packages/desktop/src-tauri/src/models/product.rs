use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub id: Option<i64>,
    pub code: String,
    pub name: String,
    pub price: f64,
    pub description: Option<String>,
    pub active: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

impl Product {
    pub fn new(code: String, name: String, price: f64) -> Self {
        Self {
            id: None,
            code,
            name,
            price,
            description: None,
            active: true,
            created_at: None,
            updated_at: None,
        }
    }
}

