use crate::models::{Sale, sale_item::SaleItem};
use anyhow::Result;

pub struct ThermalPrinter;

impl ThermalPrinter {
    pub fn print_receipt(sale: &Sale, items: &[SaleItem]) -> Result<String> {
        let mut receipt = String::new();
        
        receipt.push_str("================================\n");
        receipt.push_str("        CUPOM FISCAL\n");
        receipt.push_str("================================\n");
        receipt.push_str(&format!("Data: {}\n", sale.sale_date.format("%d/%m/%Y %H:%M")));
        receipt.push_str("--------------------------------\n");
        
        for item in items {
            receipt.push_str(&format!("{} x {}\n", item.quantity, item.unit_price));
            receipt.push_str(&format!("  Subtotal: R$ {:.2}\n", item.subtotal));
        }
        
        receipt.push_str("--------------------------------\n");
        receipt.push_str(&format!("TOTAL: R$ {:.2}\n", sale.total));
        receipt.push_str(&format!("Pagamento: {}\n", sale.payment_method));
        
        if sale.is_credit {
            receipt.push_str("--------------------------------\n");
            receipt.push_str("VENDA FIADO - RECIBO\n");
            receipt.push_str("(Não gera nota fiscal)\n");
        }
        
        receipt.push_str("================================\n");
        receipt.push_str("Obrigado pela preferência!\n");
        receipt.push_str("================================\n");
        
        Ok(receipt)
    }

    pub fn print_credit_receipt(sale: &Sale, items: &[SaleItem], balance: f64) -> Result<String> {
        let mut receipt = String::new();
        
        receipt.push_str("================================\n");
        receipt.push_str("     RECIBO - VENDA FIADO\n");
        receipt.push_str("================================\n");
        receipt.push_str(&format!("Data: {}\n", sale.sale_date.format("%d/%m/%Y %H:%M")));
        receipt.push_str("--------------------------------\n");
        
        for item in items {
            receipt.push_str(&format!("{} x {}\n", item.quantity, item.unit_price));
            receipt.push_str(&format!("  Subtotal: R$ {:.2}\n", item.subtotal));
        }
        
        receipt.push_str("--------------------------------\n");
        receipt.push_str(&format!("TOTAL: R$ {:.2}\n", sale.total));
        receipt.push_str(&format!("SALDO PENDENTE: R$ {:.2}\n", balance));
        receipt.push_str("================================\n");
        receipt.push_str("Este recibo não é documento fiscal\n");
        receipt.push_str("================================\n");
        
        Ok(receipt)
    }
}

