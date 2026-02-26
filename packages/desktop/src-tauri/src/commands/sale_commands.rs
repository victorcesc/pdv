use crate::database::get_connection;
use crate::models::Sale;
use crate::repositories::SaleRepository;
use crate::services::SaleService;
use anyhow::Result;

#[tauri::command]
pub fn create_sale(mut sale: Sale) -> Result<i64, String> {
    let mut conn = get_connection().map_err(|e| {
        eprintln!("[RUST] Error getting connection: {}", e);
        e.to_string()
    })?;
    let result = SaleService::create(&mut conn, &mut sale).map_err(|e| {
        eprintln!("[RUST] Error creating sale: {}", e);
        e.to_string()
    })?;
    eprintln!("[RUST] Sale created successfully with ID: {}", result);
    Ok(result)
}

#[tauri::command]
pub fn get_sale(id: i64) -> Result<Sale, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    SaleRepository::find_by_id(&conn, id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_sales() -> Result<Vec<Sale>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    SaleRepository::list_all(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_pending_credit_sales() -> Result<Vec<Sale>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    SaleRepository::find_pending_credit_sales(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_sale(sale: Sale) -> Result<usize, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    SaleRepository::update(&conn, &sale).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_pending_credit_sales_by_customer(customer_id: i64) -> Result<Vec<Sale>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    SaleRepository::find_pending_credit_sales_by_customer(&conn, customer_id).map_err(|e| e.to_string())
}

