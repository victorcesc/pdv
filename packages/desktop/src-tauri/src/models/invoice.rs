use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invoice {
    pub id: Option<i64>,
    pub sale_id: i64,
    pub invoice_number: Option<String>,
    pub access_key: Option<String>,
    pub issue_date: DateTime<Utc>,
    pub status: String,
    pub xml_content: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub items: Option<Vec<super::invoice_item::InvoiceItem>>,
}

impl Invoice {
    pub fn new(sale_id: i64) -> Self {
        Self {
            id: None,
            sale_id,
            invoice_number: None,
            access_key: None,
            issue_date: Utc::now(),
            status: "pending".to_string(),
            xml_content: None,
            created_at: None,
            updated_at: None,
            items: None,
        }
    }
}

