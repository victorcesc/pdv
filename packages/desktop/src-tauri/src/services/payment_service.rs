use rusqlite::Connection;
use crate::models::Payment;
use crate::repositories::{PaymentRepository, SaleRepository};
use anyhow::Result;

pub struct PaymentService;

impl PaymentService {
    pub fn create(conn: &Connection, payment: &Payment) -> Result<i64> {
        // Validate amount
        if payment.amount <= 0.0 {
            return Err(anyhow::anyhow!("Payment amount must be greater than zero"));
        }

        // Check if sale exists
        SaleRepository::find_by_id(conn, payment.sale_id)
            .map_err(|_| anyhow::anyhow!("Sale with id {} not found", payment.sale_id))?;

        // Check if payment doesn't exceed balance
        let balance = PaymentRepository::calculate_balance(conn, payment.sale_id)?;
        if payment.amount > balance {
            return Err(anyhow::anyhow!(
                "Payment amount {} exceeds balance {:.2}",
                payment.amount,
                balance
            ));
        }

        Ok(PaymentRepository::create(conn, payment)?)
    }

    pub fn get_balance(conn: &Connection, sale_id: i64) -> Result<f64> {
        Ok(PaymentRepository::calculate_balance(conn, sale_id)?)
    }

    pub fn is_paid(conn: &Connection, sale_id: i64) -> Result<bool> {
        let balance = PaymentRepository::calculate_balance(conn, sale_id)?;
        Ok(balance <= 0.0)
    }
}

