use crate::database::get_connection;
use crate::repositories::SaleRepository;
use crate::printer::ThermalPrinter;
use anyhow::Result;

#[tauri::command]
pub fn print_sale_receipt(sale_id: i64) -> Result<String, String> {
    let conn = get_connection().map_err(|e| {
        eprintln!("[RUST] Error getting connection: {}", e);
        e.to_string()
    })?;
    let sale = SaleRepository::find_by_id(&conn, sale_id).map_err(|e| {
        eprintln!("[RUST] Error finding sale: {}", e);
        e.to_string()
    })?;
    
    let items = sale.items.as_ref().ok_or("Sale has no items")?;
    
    ThermalPrinter::print_receipt(&sale, items.as_slice())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn print_credit_receipt(sale_id: i64, balance: f64) -> Result<String, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    let sale = SaleRepository::find_by_id(&conn, sale_id).map_err(|e| e.to_string())?;
    
    let items = sale.items.as_ref().ok_or("Sale has no items")?;
    
    ThermalPrinter::print_credit_receipt(&sale, items.as_slice(), balance)
        .map_err(|e| e.to_string())
}

