use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sale {
    pub id: Option<i64>,
    pub customer_id: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub customer_name: Option<String>,
    pub sale_date: DateTime<Utc>,
    pub total: f64,
    pub payment_method: String,
    pub is_credit: bool,
    pub generate_invoice: bool,
    pub status: String,
    pub notes: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub items: Option<Vec<super::sale_item::SaleItem>>,
}

// SaleItem is defined in sale_item.rs to avoid duplication

impl Sale {
    pub fn new(payment_method: String) -> Self {
        Self {
            id: None,
            customer_id: None,
            customer_name: None,
            sale_date: Utc::now(),
            total: 0.0,
            payment_method,
            is_credit: false,
            generate_invoice: true,
            status: "completed".to_string(),
            notes: None,
            created_at: None,
            updated_at: None,
            items: None,
        }
    }
}

