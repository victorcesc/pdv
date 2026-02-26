use std::fs;
use std::path::PathBuf;

fn get_token_file_path() -> PathBuf {
    let data_dir = std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("data");
    
    fs::create_dir_all(&data_dir).expect("Failed to create data directory");
    data_dir.join("auth_token.txt")
}

#[tauri::command]
pub fn set_auth_token(token: String) -> Result<(), String> {
    let token_file = get_token_file_path();
    fs::write(&token_file, token).map_err(|e| format!("Failed to write token: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn get_auth_token() -> Result<Option<String>, String> {
    let token_file = get_token_file_path();
    
    if !token_file.exists() {
        return Ok(None);
    }
    
    match fs::read_to_string(&token_file) {
        Ok(token) => Ok(Some(token.trim().to_string())),
        Err(_) => Ok(None),
    }
}

#[tauri::command]
pub fn remove_auth_token() -> Result<(), String> {
    let token_file = get_token_file_path();
    
    if token_file.exists() {
        fs::remove_file(&token_file).map_err(|e| format!("Failed to remove token: {}", e))?;
    }
    
    Ok(())
}

