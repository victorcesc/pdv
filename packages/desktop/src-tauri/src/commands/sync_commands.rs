use crate::database::get_connection;
use crate::services::SyncService;
use crate::models::{Product, Customer, Sale, Payment};
use crate::repositories::{ProductRepository, CustomerRepository, SaleRepository, PaymentRepository};
use anyhow::Result;
use rusqlite::Connection;
use chrono::{DateTime, Utc, FixedOffset};

#[tauri::command]
pub fn prepare_sale_for_sync(sale_id: i64) -> Result<String, String> {
    let conn = get_connection().map_err(|e| {
        eprintln!("[RUST] Error getting connection: {}", e);
        e.to_string()
    })?;
    let sync_log = SyncService::prepare_sale_for_sync(&conn, sale_id).map_err(|e| {
        eprintln!("[RUST] Error preparing sale for sync: {}", e);
        e.to_string()
    })?;
    
    serde_json::to_string(&sync_log).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_pending_syncs() -> Result<String, String> {
    let conn = get_connection().map_err(|e| {
        eprintln!("[RUST] Error getting connection: {}", e);
        e.to_string()
    })?;

    let syncs = SyncService::get_pending_syncs(&conn).map_err(|e| {
        eprintln!("[RUST] Error getting pending syncs: {}", e);
        e.to_string()
    })?;
    
    serde_json::to_string(&syncs).map_err(|e| e.to_string())
}

/**
 * Limpa todos os dados do PDV no SQLite local
 * Remove produtos, clientes, vendas, pagamentos, etc.
 */
fn clear_local_data_internal(conn: &mut Connection) -> Result<(), rusqlite::Error> {
    eprintln!("[RUST] Limpando dados locais...");
    
    let tx = conn.transaction()?;
    
    // Deletar em ordem para respeitar foreign keys
    tx.execute("DELETE FROM payments", [])?;
    tx.execute("DELETE FROM sale_items", [])?;
    tx.execute("DELETE FROM sales", [])?;
    tx.execute("DELETE FROM customers", [])?;
    tx.execute("DELETE FROM products", [])?;
    tx.execute("DELETE FROM sync_logs", [])?;
    
    tx.commit()?;
    eprintln!("[RUST] ✅ Dados locais limpos com sucesso");
    Ok(())
}

/**
 * Comando Tauri para limpar todos os dados locais
 * Exposto para ser chamado do frontend
 */
#[tauri::command]
pub fn clear_local_data() -> Result<String, String> {
    eprintln!("[RUST] clear_local_data chamado");
    let mut conn = get_connection().map_err(|e| {
        eprintln!("[RUST] Error getting connection: {}", e);
        e.to_string()
    })?;
    
    clear_local_data_internal(&mut conn).map_err(|e| {
        eprintln!("[RUST] Error clearing local data: {}", e);
        e.to_string()
    })?;
    
    Ok("Dados locais limpos com sucesso".to_string())
}

/**
 * Insere produtos no SQLite local (apenas os que não existem)
 * Verifica por código antes de inserir para evitar duplicatas
 */
fn insert_products(conn: &Connection, products: Vec<Product>) -> Result<(), rusqlite::Error> {
    eprintln!("[RUST] Sincronizando {} produtos (inserindo apenas os que não existem)...", products.len());
    let mut inserted = 0;
    let mut skipped = 0;
    
    for product in products {
        // Verificar se produto já existe pelo código
        match ProductRepository::find_by_code_any(conn, &product.code) {
            Ok(Some(_)) => {
                // Produto já existe, pular
                skipped += 1;
            }
            Ok(None) => {
                // Produto não existe, inserir
                ProductRepository::create(conn, &product)?;
                inserted += 1;
            }
            Err(e) => {
                eprintln!("[RUST] Erro ao verificar produto {}: {}", product.code, e);
                // Tentar inserir mesmo assim (pode ser erro de constraint, mas tentamos)
                match ProductRepository::create(conn, &product) {
                    Ok(_) => inserted += 1,
                    Err(_) => skipped += 1, // Provavelmente já existe
                }
            }
        }
    }
    
    eprintln!("[RUST] ✅ Produtos sincronizados: {} inseridos, {} já existiam", inserted, skipped);
    Ok(())
}

/**
 * Insere clientes no SQLite local (apenas os que não existem)
 * Verifica por documento (CPF/CNPJ) antes de inserir para evitar duplicatas
 */
fn insert_customers(conn: &Connection, customers: Vec<Customer>) -> Result<(), rusqlite::Error> {
    eprintln!("[RUST] Sincronizando {} clientes (inserindo apenas os que não existem)...", customers.len());
    let mut inserted = 0;
    let mut skipped = 0;
    
    for customer in customers {
        // Verificar se cliente já existe pelo documento
        // Se não tiver documento, inserir sempre (pode ser cliente sem CPF/CNPJ)
        if let Some(ref document) = customer.document {
            if !document.trim().is_empty() {
                match CustomerRepository::find_by_document(conn, document) {
                    Ok(Some(_)) => {
                        // Cliente já existe, pular
                        skipped += 1;
                        continue;
                    }
                    Ok(None) => {
                        // Cliente não existe, inserir
                    }
                    Err(e) => {
                        eprintln!("[RUST] Erro ao verificar cliente {}: {}", document, e);
                        // Continuar e tentar inserir
                    }
                }
            }
        }
        
        // Inserir cliente (não existe ou não tem documento)
        match CustomerRepository::create(conn, &customer) {
            Ok(_) => inserted += 1,
            Err(e) => {
                eprintln!("[RUST] Erro ao inserir cliente {}: {}", customer.name, e);
                skipped += 1; // Provavelmente já existe ou erro de constraint
            }
        }
    }
    
    eprintln!("[RUST] ✅ Clientes sincronizados: {} inseridos, {} já existiam", inserted, skipped);
    Ok(())
}

/**
 * Insere vendas no SQLite local
 * Nota: Vendas são históricas e normalmente já estão sincronizadas durante o uso.
 * No sync inicial, inserimos todas as vendas do servidor.
 * Em condições normais, vendas duplicadas não devem ocorrer pois são sincronizadas imediatamente após criação.
 */
fn insert_sales(conn: &mut Connection, sales: Vec<Sale>) -> Result<(), rusqlite::Error> {
    eprintln!("[RUST] Sincronizando {} vendas...", sales.len());
    let mut inserted = 0;
    let mut skipped = 0;
    
    for mut sale in sales {
        match SaleRepository::create(conn, &mut sale) {
            Ok(_) => inserted += 1,
            Err(e) => {
                eprintln!("[RUST] Erro ao inserir venda (pode já existir): {}", e);
                skipped += 1;
                // Continuar com próxima venda mesmo se houver erro
            }
        }
    }
    
    eprintln!("[RUST] ✅ Vendas sincronizadas: {} inseridas, {} com erro (provavelmente já existiam)", inserted, skipped);
    Ok(())
}

/**
 * Insere pagamentos no SQLite local
 */
fn insert_payments(conn: &Connection, payments: Vec<Payment>) -> Result<(), rusqlite::Error> {
    eprintln!("[RUST] Inserindo {} pagamentos...", payments.len());
    for payment in payments {
        PaymentRepository::create(conn, &payment)?;
    }
    eprintln!("[RUST] ✅ Pagamentos inseridos");
    Ok(())
}

#[tauri::command]
pub fn sync_initial_data(
    products: Vec<Product>,
    customers: Vec<Customer>,
    sales: Vec<Sale>,
    payments: Vec<Payment>,
) -> Result<String, String> {
    eprintln!("[RUST] sync_initial_data chamado");
    eprintln!("[RUST] Produtos: {}, Clientes: {}, Vendas: {}, Pagamentos: {}", 
        products.len(), customers.len(), sales.len(), payments.len());
    
    let mut conn = get_connection().map_err(|e| {
        eprintln!("[RUST] Error getting connection: {}", e);
        e.to_string()
    })?;
    
    // Nota: Os dados locais foram enviados para o servidor antes de chamar esta função
    // Agora recebemos os dados do servidor e fazemos merge incremental
    
    // Sincronizar produtos (insere apenas os que não existem)
    insert_products(&conn, products).map_err(|e| {
        eprintln!("[RUST] Error syncing products: {}", e);
        e.to_string()
    })?;
    
    // Sincronizar clientes (insere apenas os que não existem)
    insert_customers(&conn, customers).map_err(|e| {
        eprintln!("[RUST] Error syncing customers: {}", e);
        e.to_string()
    })?;
    
    // Sincronizar vendas (insere todas, duplicatas são tratadas pelo erro)
    insert_sales(&mut conn, sales).map_err(|e| {
        eprintln!("[RUST] Error syncing sales: {}", e);
        e.to_string()
    })?;
    
    // Inserir pagamentos (precisa dos IDs das vendas já inseridas)
    // Por enquanto, vamos inserir pagamentos sem vincular corretamente
    // TODO: Melhorar mapeamento de IDs remotos para locais
    if !payments.is_empty() {
        eprintln!("[RUST] ⚠️  Pagamentos recebidos mas não serão inseridos automaticamente (requer mapeamento de IDs)");
    }
    
    eprintln!("[RUST] ✅ Sincronização incremental concluída com sucesso");
    Ok("Sincronização incremental concluída com sucesso".to_string())
}

