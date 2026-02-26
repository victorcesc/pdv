use crate::database::get_connection;
use crate::models::Invoice;
use crate::repositories::InvoiceRepository;
use crate::services::InvoiceService;
use anyhow::Result;

#[tauri::command]
pub fn create_invoice(mut invoice: Invoice) -> Result<i64, String> {
    let mut conn = get_connection().map_err(|e| {
        eprintln!("[RUST] Error getting connection: {}", e);
        e.to_string()
    })?;
    let result = InvoiceService::create(&mut conn, &mut invoice).map_err(|e| {
        eprintln!("[RUST] Error creating invoice: {}", e);
        e.to_string()
    })?;
    eprintln!("[RUST] Invoice created successfully with ID: {}", result);
    Ok(result)
}

#[tauri::command]
pub fn get_invoice(id: i64) -> Result<Invoice, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    InvoiceRepository::find_by_id(&conn, id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_invoice_by_access_key(access_key: String) -> Result<Option<Invoice>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    InvoiceRepository::find_by_access_key(&conn, &access_key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_invoice_status(id: i64, status: String) -> Result<usize, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    InvoiceService::update_status(&conn, id, &status).map_err(|e| e.to_string())
}

