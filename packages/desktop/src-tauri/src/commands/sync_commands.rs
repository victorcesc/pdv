use crate::database::get_connection;
use crate::services::SyncService;
use anyhow::Result;

#[tauri::command]
pub fn prepare_sale_for_sync(sale_id: i64) -> Result<String, String> {
    let conn = get_connection().map_err(|e| {
        eprintln!("[RUST] Error getting connection: {}", e);
        e.to_string()
    })?;
    let sync_log = SyncService::prepare_sale_for_sync(&conn, sale_id).map_err(|e| {
        eprintln!("[RUST] Error preparing sale for sync: {}", e);
        e.to_string()
    })?;
    // let sync_log = SyncService::prepare_sale_for_sync(&conn, sale_id)
    //     .map_err(|e| e.to_string())?;
    
    serde_json::to_string(&sync_log).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_pending_syncs() -> Result<String, String> {
    let conn = get_connection().map_err(|e| {
        eprintln!("[RUST] Error getting connection: {}", e);
        e.to_string()
    })?;

    let syncs = SyncService::get_pending_syncs(&conn).map_err(|e| {
        eprintln!("[RUST] Error getting pending syncs: {}", e);
        e.to_string()
    })?;
    
    serde_json::to_string(&syncs).map_err(|e| e.to_string())
}

