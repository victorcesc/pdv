use crate::database::get_connection;
use crate::models::Product;
use crate::repositories::ProductRepository;
use crate::services::ProductService;
use anyhow::Result;

#[tauri::command]
pub fn create_product(product: Product) -> Result<i64, String> {
    let conn = get_connection().map_err(|e| {
        eprintln!("[RUST] Error getting connection: {}", e);
        e.to_string()
    })?;
    let result = ProductService::create(&conn, &product).map_err(|e| {
        eprintln!("[RUST] Error creating product: {}", e);
        let error_msg = e.to_string();
        // Check if it's a UNIQUE constraint error from SQLite
        if error_msg.contains("UNIQUE constraint") || error_msg.contains("UNIQUE constraint failed") {
            return "PRODUCT_CODE_EXISTS_INACTIVE".to_string();
        }
        error_msg
    })?;
    eprintln!("[RUST] Product created successfully with ID: {}", result);
    Ok(result)
}

#[tauri::command]
pub fn get_product(id: i64) -> Result<Product, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    ProductRepository::find_by_id(&conn, id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_product_by_code(code: String) -> Result<Option<Product>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    ProductRepository::find_by_code(&conn, &code).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_products() -> Result<Vec<Product>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    ProductRepository::list_all(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn search_products(query: String) -> Result<Vec<Product>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    ProductRepository::search(&conn, &query).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_product(product: Product) -> Result<usize, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    ProductService::update(&conn, &product).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_product(id: i64) -> Result<usize, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    ProductService::delete(&conn, id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_deleted_products() -> Result<Vec<Product>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    ProductRepository::list_deleted(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reactivate_product(id: i64) -> Result<usize, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    ProductRepository::reactivate(&conn, id).map_err(|e| e.to_string())
}

