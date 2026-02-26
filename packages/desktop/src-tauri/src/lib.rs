pub mod database;
pub mod models;
pub mod repositories;
pub mod services;
pub mod commands;
pub mod printer;
pub mod sync;

use database::init_database;

pub fn init() -> Result<(), rusqlite::Error> {
    init_database()?;
    Ok(())
}

