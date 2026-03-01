import { useState, useEffect } from "react";
import {
  getPendingCreditSales,
  getPendingCreditSalesByCustomer,
  getPaymentsBySale,
  getSaleBalance,
  createPayment,
  getCustomer,
  getSale,
  getProduct,
} from "../services/api";
import CustomerSearch from "../components/CustomerSearch";
import type { Sale, Payment, Customer, SaleItem, Product } from "../types";
import { t, formatDate, formatDateTime } from "../i18n";
import "../styles/components.css";

export default function CreditSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saleCustomer, setSaleCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("dinheiro");
  const [saleItems, setSaleItems] = useState<Array<SaleItem & { product?: Product }>>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);

  // Carregar vendas quando selectedCustomer mudar
  useEffect(() => {
    loadSales();
  }, [selectedCustomer]);

  // Escutar evento de sincronização concluída para recarregar dados
  useEffect(() => {
    const handleSyncCompleted = () => {
      console.log("[CREDIT_SALES] Sincronização concluída, recarregando vendas...");
      loadSales();
    };
    
    window.addEventListener("syncCompleted", handleSyncCompleted);
    
    return () => {
      window.removeEventListener("syncCompleted", handleSyncCompleted);
    };
  }, []);

  useEffect(() => {
    if (selectedSale?.id) {
      loadPayments(selectedSale.id);
      loadBalance(selectedSale.id);
      loadSaleItems(selectedSale.id);
      if (selectedSale.customer_id) {
        loadCustomer(selectedSale.customer_id);
      } else {
        setSaleCustomer(null);
      }
    } else {
      setSaleItems([]);
    }
  }, [selectedSale]);

  const loadSales = async (): Promise<void> => {
    try {
      let result: Sale[];
      if (selectedCustomer?.id) {
        result = await getPendingCreditSalesByCustomer(selectedCustomer.id);
      } else {
        result = await getPendingCreditSales();
      }
      setSales(result);
    } catch (error: unknown) {
      console.error("Error loading credit sales:", error);
    }
  };

  const loadCustomer = async (customerId: number): Promise<void> => {
    try {
      const result: Customer = await getCustomer(customerId);
      setSaleCustomer(result);
    } catch (error: unknown) {
      console.error("Error loading customer:", error);
      setSaleCustomer(null);
    }
  };

  const handleSelectCustomer = (customer: Customer | null): void => {
    setSelectedCustomer(customer);
  };

  const loadPayments = async (saleId: number): Promise<void> => {
    try {
      const result: Payment[] = await getPaymentsBySale(saleId);
      setPayments(result);
    } catch (error: unknown) {
      console.error("Error loading payments:", error);
    }
  };

  const loadBalance = async (saleId: number): Promise<void> => {
    try {
      const result: number = await getSaleBalance(saleId);
      setBalance(result);
    } catch (error: unknown) {
      console.error("Error loading balance:", error);
    }
  };

  const loadSaleItems = async (saleId: number): Promise<void> => {
    setLoadingItems(true);
    try {
      const sale: Sale = await getSale(saleId);
      if (sale.items && sale.items.length > 0) {
        // Buscar informações dos produtos para cada item
        const itemsWithProducts = await Promise.all(
          sale.items.map(async (item: SaleItem) => {
            try {
              const product: Product = await getProduct(item.product_id);
              return { ...item, product };
            } catch (error: unknown) {
              console.error(`Error loading product ${item.product_id}:`, error);
              return { ...item, product: undefined };
            }
          })
        );
        setSaleItems(itemsWithProducts);
      } else {
        setSaleItems([]);
      }
    } catch (error: unknown) {
      console.error("Error loading sale items:", error);
      setSaleItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const handlePayment = async (): Promise<void> => {
    if (!selectedSale?.id || paymentAmount <= 0) {
      alert(t("creditSales.selectSaleAndAmount"));
      return;
    }

    if (paymentAmount > balance) {
      alert(`${t("creditSales.amountExceedsBalance")} ${balance.toFixed(2)}`);
      return;
    }

    try {
      await createPayment({
        sale_id: selectedSale.id,
        amount: paymentAmount,
        payment_method: paymentMethod,
        payment_date: new Date().toISOString(),
      });
      setPaymentAmount(0);
      if (selectedSale.id) {
        loadPayments(selectedSale.id);
        loadBalance(selectedSale.id);
      }
      loadSales();
      alert(t("creditSales.paymentSuccess"));
    } catch (error: unknown) {
      alert(`${t("creditSales.paymentError")} ${error}`);
    }
  };

  return (
    <div className="container credit-sales-container">
      <h2 className="page-title">{t("creditSales.title")}</h2>
      <div className="filter-section">
        <h3 className="section-title">{t("creditSales.filterByCustomer")}</h3>
        <CustomerSearch
          onSelectCustomer={handleSelectCustomer}
          selectedCustomer={selectedCustomer}
        />
      </div>
      <div className="sales-grid">
        <div className="sales-list">
          <h3 className="section-title">{t("creditSales.pendingSales")}</h3>
          <table className="table">
            <thead>
              <tr>
                <th>{t("creditSales.date")}</th>
                <th>{t("creditSales.customer")}</th>
                <th>{t("creditSales.total")}</th>
                <th>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-empty">
                    {t("creditSales.noPendingSales")}
                  </td>
                </tr>
              ) : (
                sales.map((sale: Sale) => (
                  <tr
                    key={sale.id}
                    className={`sale-row ${selectedSale?.id === sale.id ? "selected" : ""}`}
                    onClick={() => setSelectedSale(sale)}
                  >
                    <td>
                      {formatDate(sale.sale_date)}
                    </td>
                    <td>
                      {sale.customer_name || t("creditSales.noCustomer")}
                    </td>
                    <td>
                      R$ {sale.total.toFixed(2)}
                    </td>
                    <td>
                      <button 
                        className="btn btn-primary btn-small"
                        onClick={() => setSelectedSale(sale)}
                      >
                        {t("creditSales.view")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {selectedSale && (
          <div className="sale-details">
            <h3 className="section-title">{t("creditSales.saleDetails")}</h3>
            <div className="sale-info-card mb-2">
              <p>
                <strong>{t("creditSales.date")}</strong>{" "}
                {formatDateTime(selectedSale.sale_date)}
              </p>
              {saleCustomer && (
                <p>
                  <strong>{t("creditSales.customer")}</strong> {saleCustomer.name}
                  {saleCustomer.document && ` - ${saleCustomer.document}`}
                  {saleCustomer.phone && ` - ${saleCustomer.phone}`}
                </p>
              )}
              <p>
                <strong>{t("creditSales.total")}</strong> R$ {selectedSale.total.toFixed(2)}
              </p>
              <p>
                <strong>{t("creditSales.pendingBalance")}</strong> R$ {balance.toFixed(2)}
              </p>
            </div>
            <h4 className="section-title">{t("creditSales.saleProducts")}</h4>
            {loadingItems ? (
              <p className="loading-text">{t("creditSales.loadingProducts")}</p>
            ) : saleItems.length === 0 ? (
              <p className="table-empty">{t("creditSales.noProducts")}</p>
            ) : (
              <table className="table mb-2">
                <thead>
                  <tr>
                    <th>{t("creditSales.product")}</th>
                    <th>{t("creditSales.code")}</th>
                    <th>{t("creditSales.quantity")}</th>
                    <th>{t("creditSales.unitPrice")}</th>
                    <th>{t("creditSales.subtotal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {saleItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product?.name || t("creditSales.productNotFound")}</td>
                      <td>{item.product?.code || "-"}</td>
                      <td>{item.quantity}</td>
                      <td>R$ {item.unit_price.toFixed(2)}</td>
                      <td>R$ {item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <h4 className="section-title">{t("creditSales.paymentHistory")}</h4>
            <table className="table mb-2">
              <thead>
                <tr>
                  <th>{t("creditSales.date")}</th>
                  <th>{t("creditSales.value")}</th>
                  <th>{t("creditSales.method")}</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="table-empty">
                      {t("creditSales.noPayments")}
                    </td>
                  </tr>
                ) : (
                  payments.map((payment: Payment) => (
                    <tr key={payment.id}>
                      <td>
                        {formatDate(payment.payment_date)}
                      </td>
                      <td>
                        R$ {payment.amount.toFixed(2)}
                      </td>
                      <td>
                        {payment.payment_method}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {balance > 0 && (
              <div className="payment-form">
                <h4>{t("creditSales.registerPayment")}</h4>
                <div className="form-group">
                  <label className="form-label">
                    {t("creditSales.amount")}
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={balance}
                      value={paymentAmount || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPaymentAmount(parseFloat(e.target.value) || 0)
                      }
                      className="form-input"
                    />
                  </label>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {t("creditSales.paymentMethod")}
                    <select
                      value={paymentMethod}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setPaymentMethod(e.target.value)
                      }
                      className="form-select"
                    >
                      <option value="dinheiro">{t("creditSales.paymentMethods.cash")}</option>
                      <option value="cartao_credito">{t("creditSales.paymentMethods.creditCard")}</option>
                      <option value="cartao_debito">{t("creditSales.paymentMethods.debitCard")}</option>
                      <option value="pix">{t("creditSales.paymentMethods.pix")}</option>
                    </select>
                  </label>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={handlePayment}
                >
                  {t("creditSales.register")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
