use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncLog {
    pub id: Option<i64>,
    pub entity_type: String,
    pub entity_id: i64,
    pub action: String,
    pub payload_json: Option<String>,
    pub synced: bool,
    pub sync_date: Option<DateTime<Utc>>,
    pub error_message: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

impl SyncLog {
    pub fn new(entity_type: String, entity_id: i64, action: String) -> Self {
        Self {
            id: None,
            entity_type,
            entity_id,
            action,
            payload_json: None,
            synced: false,
            sync_date: None,
            error_message: None,
            created_at: None,
        }
    }
}

