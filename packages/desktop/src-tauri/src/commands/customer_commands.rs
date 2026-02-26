use crate::database::get_connection;
use crate::models::Customer;
use crate::repositories::CustomerRepository;
use crate::services::CustomerService;
use anyhow::Result;

#[tauri::command]
pub fn create_customer(customer: Customer) -> Result<i64, String> {
    eprintln!("[RUST] create_customer called!");
    eprintln!("[RUST] Customer data: {:?}", customer);
    let conn = get_connection().map_err(|e| {
        eprintln!("[RUST] Error getting connection: {}", e);
        e.to_string()
    })?;
    eprintln!("[RUST] Connection obtained, calling service...");
    let result = CustomerService::create(&conn, &customer).map_err(|e| {
        eprintln!("[RUST] Error creating customer: {}", e);
        e.to_string()
    })?;
    eprintln!("[RUST] Customer created successfully with ID: {}", result);
    Ok(result)
}

#[tauri::command]
pub fn get_customer(id: i64) -> Result<Customer, String> {

    let conn = get_connection().map_err(|e| {
        eprintln!("[RUST] Error getting connection: {}", e);
        e.to_string()
    })?;    
    
    let teste = CustomerRepository::find_by_id(&conn, id).map_err(|e| e.to_string());
    println!("[RUST] Teste: {:?}", teste);
    teste
}

#[tauri::command]
pub fn get_customer_by_document(document: String) -> Result<Option<Customer>, String> {
    let conn = get_connection().map_err(|e| {
        eprintln!("[RUST] Error getting connection: {}", e);
        e.to_string()
    })?;
    CustomerRepository::find_by_document(&conn, &document).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_customers() -> Result<Vec<Customer>, String> {
    let conn = get_connection().map_err(|e| {
        eprintln!("[RUST] Error getting connection: {}", e);
        e.to_string()
    })?;
    CustomerRepository::list_all(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_customer(customer: Customer) -> Result<usize, String> {
    let conn = get_connection().map_err(|e| {
        eprintln!("[RUST] Error getting connection: {}", e);
        e.to_string()
    })?;
    CustomerService::update(&conn, &customer).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_customer(id: i64) -> Result<usize, String> {
    let conn = get_connection().map_err(|e| {
        eprintln!("[RUST] Error getting connection: {}", e);
        e.to_string()
    })?;
    CustomerService::delete(&conn, id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn search_customers(query: String) -> Result<Vec<Customer>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    CustomerRepository::search(&conn, &query).map_err(|e| e.to_string())
}

