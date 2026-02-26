use rusqlite::Connection;
use crate::models::{Sale, SyncLog};
use crate::repositories::{SyncRepository, SaleRepository};
use serde_json;
use anyhow::Result;

pub struct SyncService;

impl SyncService {
    pub fn prepare_sale_for_sync(conn: &Connection, sale_id: i64) -> Result<SyncLog> {
        let sale = SaleRepository::find_by_id(conn, sale_id)?;

        // Only sync sales that should generate invoice and are not credit
        if !sale.generate_invoice || sale.is_credit {
            return Err(anyhow::anyhow!(
                "Sale {} should not be synced (credit or no invoice)",
                sale_id
            ));
        }

        // Create JSON payload for synchronization
        let payload = serde_json::json!({
            "sale": {
                "id": sale.id,
                "customer_id": sale.customer_id,
                "sale_date": sale.sale_date.to_rfc3339(),
                "total": sale.total,
                "payment_method": sale.payment_method,
                "items": sale.items,
            }
        });

        let payload_str = serde_json::to_string(&payload)?;
        
        Ok(SyncLog {
            id: None,
            entity_type: "sale".to_string(),
            entity_id: sale_id,
            action: "create".to_string(),
            payload_json: Some(payload_str),
            synced: false,
            sync_date: None,
            error_message: None,
            created_at: None,
        })
    }

    pub fn create_sync_log(conn: &Connection, sync_log: &SyncLog) -> Result<i64> {
        Ok(SyncRepository::create(conn, sync_log)?)
    }

    pub fn get_pending_syncs(conn: &Connection) -> Result<Vec<SyncLog>> {
        Ok(SyncRepository::find_pending(conn)?)
    }

    pub fn filter_sales_for_sync(conn: &Connection) -> Result<Vec<Sale>> {
        // Get all sales that should be synced (generate_invoice = true and is_credit = false)
        let all_sales = SaleRepository::list_all(conn)?;
        Ok(all_sales
            .into_iter()
            .filter(|sale| sale.generate_invoice && !sale.is_credit)
            .collect())
    }
}
