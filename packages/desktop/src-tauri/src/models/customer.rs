use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Customer {
    pub id: Option<i64>,
    pub name: String,
    pub document: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    #[serde(default = "default_active")]
    pub active: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

fn default_active() -> bool {
    true
}

impl Customer {
    pub fn new(name: String) -> Self {
        Self {
            id: None,
            name,
            document: None,
            phone: None,
            email: None,
            address: None,
            active: true,
            created_at: None,
            updated_at: None,
        }
    }
}

