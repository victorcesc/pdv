use crate::database::get_connection;
use crate::models::Payment;
use crate::repositories::PaymentRepository;
use crate::services::PaymentService;
use anyhow::Result;

#[tauri::command]
pub fn create_payment(payment: Payment) -> Result<i64, String> {
    let conn = get_connection().map_err(|e| {
        eprintln!("[RUST] Error getting connection: {}", e);
        e.to_string()
    })?;
    let result = PaymentService::create(&conn, &payment).map_err(|e| {
        eprintln!("[RUST] Error creating payment: {}", e);
        e.to_string()
    })?;
    eprintln!("[RUST] Payment created successfully with ID: {}", result);
    PaymentService::create(&conn, &payment).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_payment(id: i64) -> Result<Payment, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    PaymentRepository::find_by_id(&conn, id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_payments_by_sale(sale_id: i64) -> Result<Vec<Payment>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    PaymentRepository::find_by_sale_id(&conn, sale_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_sale_balance(sale_id: i64) -> Result<f64, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    PaymentService::get_balance(&conn, sale_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn is_sale_paid(sale_id: i64) -> Result<bool, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    PaymentService::is_paid(&conn, sale_id).map_err(|e| e.to_string())
}

