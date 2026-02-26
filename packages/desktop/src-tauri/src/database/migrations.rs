use rusqlite::{Connection, Result};

pub fn run_migrations(conn: &Connection) -> Result<()> {
    // Create migrations table to track version
    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    let current_version: i32 = conn
        .query_row(
            "SELECT MAX(version) FROM schema_migrations",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    // Migration 1: Initial schema
    if current_version < 1 {
        create_initial_schema(conn)?;
        conn.execute(
            "INSERT INTO schema_migrations (version) VALUES (1)",
            [],
        )?;
    }

    Ok(())
}

fn create_initial_schema(conn: &Connection) -> Result<()> {
    // Tabela de Clientes
    conn.execute(
        "CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            document TEXT UNIQUE,
            phone TEXT,
            email TEXT,
            address TEXT,
            active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Tabela de Produtos
    conn.execute(
        "CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            price REAL NOT NULL CHECK(price >= 0),
            description TEXT,
            active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Tabela de Vendas
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            total REAL NOT NULL CHECK(total >= 0),
            payment_method TEXT NOT NULL,
            is_credit BOOLEAN DEFAULT 0,
            generate_invoice BOOLEAN DEFAULT 1,
            status TEXT NOT NULL DEFAULT 'completed',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
        )",
        [],
    )?;

    // Tabela de Itens de Venda
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL CHECK(quantity > 0),
            unit_price REAL NOT NULL CHECK(unit_price >= 0),
            subtotal REAL NOT NULL CHECK(subtotal >= 0),
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
        )",
        [],
    )?;

    // Tabela de Pagamentos
    conn.execute(
        "CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            amount REAL NOT NULL CHECK(amount > 0),
            payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            payment_method TEXT NOT NULL,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Tabela de Notas Fiscais
    conn.execute(
        "CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            invoice_number TEXT UNIQUE,
            access_key TEXT UNIQUE,
            issue_date DATETIME NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            xml_content TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Tabela de Itens da Nota Fiscal
    conn.execute(
        "CREATE TABLE IF NOT EXISTS invoice_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL CHECK(quantity > 0),
            unit_price REAL NOT NULL CHECK(unit_price >= 0),
            subtotal REAL NOT NULL CHECK(subtotal >= 0),
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
        )",
        [],
    )?;

    // Tabela de Logs de Sincronização
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sync_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_type TEXT NOT NULL,
            entity_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            payload_json TEXT,
            synced BOOLEAN DEFAULT 0,
            sync_date DATETIME,
            error_message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Índices
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sales_is_credit ON sales(is_credit)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON payments(sale_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_invoices_sale_id ON invoices(sale_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sync_logs_entity ON sync_logs(entity_type, entity_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sync_logs_synced ON sync_logs(synced)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_customers_document ON customers(document)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_products_code ON products(code)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_products_active ON products(active)", [])?;

    // Triggers para updated_at
    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS update_customers_timestamp 
         AFTER UPDATE ON customers
         BEGIN
             UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
         END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS update_products_timestamp 
         AFTER UPDATE ON products
         BEGIN
             UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
         END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS update_sales_timestamp 
         AFTER UPDATE ON sales
         BEGIN
             UPDATE sales SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
         END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS update_invoices_timestamp 
         AFTER UPDATE ON invoices
         BEGIN
             UPDATE invoices SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
         END",
        [],
    )?;

    Ok(())
}

