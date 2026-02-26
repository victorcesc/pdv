// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use pdv_tauri::init;
use pdv_tauri::commands::*;

fn main() {
    // Initialize database
    if let Err(e) = init() {
        eprintln!("Failed to initialize database: {}", e);
    }

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // Product commands
            create_product,
            get_product,
            get_product_by_code,
            list_products,
            search_products,
            update_product,
            delete_product,
            list_deleted_products,
            reactivate_product,
            // Customer commands
            create_customer,
            get_customer,
            get_customer_by_document,
            list_customers,
            search_customers,
            update_customer,
            delete_customer,
            // Sale commands
            create_sale,
            get_sale,
            list_sales,
            get_pending_credit_sales,
            get_pending_credit_sales_by_customer,
            update_sale,
            // Payment commands
            create_payment,
            get_payment,
            get_payments_by_sale,
            get_sale_balance,
            is_sale_paid,
            // Invoice commands
            create_invoice,
            get_invoice,
            get_invoice_by_access_key,
            update_invoice_status,
            // Sync commands
            prepare_sale_for_sync,
            get_pending_syncs,
            // Printer commands
            print_sale_receipt,
            print_credit_receipt,
            // Auth commands
            set_auth_token,
            get_auth_token,
            remove_auth_token,
        ]).setup(|app| {
            #[cfg(debug_assertions)]
            {
                use tauri::Manager;

                let window = app.get_window("main");
                if let Some(window) = window {
                    window.open_devtools();
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
        // Note: rust-analyzer may show an error about OUT_DIR here, but this is a false positive.
        // The build.rs script sets OUT_DIR during actual compilation, so this will work correctly.
       
}

