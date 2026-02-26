use rusqlite::{Connection, Result};
use std::path::PathBuf;
use crate::database::migrations::run_migrations;

pub fn get_database_path() -> PathBuf {
    // For now, use local directory. In production, use app data directory
    let db_dir = std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("data");
    
    std::fs::create_dir_all(&db_dir).expect("Failed to create data directory");
    
    db_dir.join("pdv.db")
}

pub fn init_database() -> Result<Connection> {
    let db_path = get_database_path();
    let conn = Connection::open(db_path)?;
    
    // Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON", [])?;
    
    // Run migrations
    run_migrations(&conn)?;
    
    Ok(conn)
}

pub fn get_connection() -> Result<Connection> {
    let db_path = get_database_path();
    let  conn = Connection::open(db_path)?;
    conn.execute("PRAGMA foreign_keys = ON", [])?;
    Ok(conn)
}

