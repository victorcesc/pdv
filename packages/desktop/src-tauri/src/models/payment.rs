use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Payment {
    pub id: Option<i64>,
    pub sale_id: i64,
    pub amount: f64,
    pub payment_date: DateTime<Utc>,
    pub payment_method: String,
    pub notes: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

impl Payment {
    pub fn new(sale_id: i64, amount: f64, payment_method: String) -> Self {
        Self {
            id: None,
            sale_id,
            amount,
            payment_date: Utc::now(),
            payment_method,
            notes: None,
            created_at: None,
        }
    }
}

