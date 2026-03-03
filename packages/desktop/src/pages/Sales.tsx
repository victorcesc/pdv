import { useState } from "react";
import { createSale, getSale } from "../services/api";
import { syncSale } from "../services/sync";
import ProductSearch from "../components/ProductSearch";
import CustomerSearch from "../components/CustomerSearch";
import Cart from "../components/Cart";
import type { Product, CartItem, Sale, Customer } from "../types";
import { t } from "../i18n";
import "../styles/components.css";

export default function Sales() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCredit, setIsCredit] = useState<boolean>(false);
  const [generateInvoice, setGenerateInvoice] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<string>("dinheiro");

  const addToCart = (product: Product): void => {
    setCart((prev: CartItem[]) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.product.price,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          subtotal: product.price,
        },
      ];
    });
  };

  const removeFromCart = (productId: number): void => {
    setCart((prev: CartItem[]) =>
      prev.filter((item) => item.product.id !== productId)
    );
  };

  const updateQuantity = (productId: number, quantity: number): void => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev: CartItem[]) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.product.price,
            }
          : item
      )
    );
  };

  const total: number = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleFinalizeSale = async (): Promise<void> => {
    if (cart.length === 0) {
      alert(t("sales.addToCart"));
      return;
    }

    const sale: Sale = {
      customer_id: customerId ?? undefined,
      sale_date: new Date().toISOString(),
      total,
      payment_method: paymentMethod,
      is_credit: isCredit,
      generate_invoice: isCredit ? false : generateInvoice,
      status: "completed",
      items: cart.map((item) => ({
        product_id: item.product.id!,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.subtotal,
      })),
    };

    try {
      const saleId = await createSale(sale);
      alert(t("sales.saleSuccess"));
      
      // Busca a venda completa com itens para sincronização
      try {
        const completeSale = await getSale(saleId);
        
        // Sincroniza com a API cloud (não-bloqueante)
        // Sempre sincroniza quando finalizar uma venda
        syncSale(completeSale).catch((syncError) => {
          console.error("[SYNC] Erro ao sincronizar venda:", syncError);
          // Não mostra erro ao usuário para não interromper o fluxo
        });
      } catch (syncError) {
        console.error("[SYNC] Erro ao buscar venda para sincronização:", syncError);
        // Continua normalmente mesmo se a sincronização falhar
      }
      
      setCart([]);
      setCustomerId(null);
      setSelectedCustomer(null);
      setIsCredit(false);
      setGenerateInvoice(true);
    } catch (error: unknown) {
      alert(`${t("sales.saleError")} ${error}`);
    }
  };

  const handleSelectCustomer = (customer: Customer | null): void => {
    setSelectedCustomer(customer);
    setCustomerId(customer?.id ?? null);
  };

  return (
    <div className="sales-page-container">
      <div className="sales-main-section">
        <h2 className="page-title">{t("sales.title")}</h2>
        <div className="sales-options">
          <label>
            <input
              type="checkbox"
              checked={isCredit}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setIsCredit(e.target.checked);
                if (e.target.checked) {
                  setGenerateInvoice(false);
                }
              }}
            />
            {t("sales.creditSale")}
          </label>
          {!isCredit && (
            <label>
              <input
                type="checkbox"
                checked={generateInvoice}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setGenerateInvoice(e.target.checked)
                }
              />
              {t("sales.generateInvoice")}
            </label>
          )}
          <label className="form-label mt-2" style={{ display: "block" }}>
            {t("sales.paymentMethod")}
            <select
              value={paymentMethod}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setPaymentMethod(e.target.value)
              }
              className="form-select"
            >
              <option value="dinheiro">{t("sales.paymentMethods.cash")}</option>
              <option value="cartao_credito">{t("sales.paymentMethods.creditCard")}</option>
              <option value="cartao_debito">{t("sales.paymentMethods.debitCard")}</option>
              <option value="pix">{t("sales.paymentMethods.pix")}</option>
              {isCredit && <option value="fiado">{t("sales.paymentMethods.credit")}</option>}
            </select>
          </label>
        </div>
        <div className="mb-2">
          <h3 className="section-title">{t("sales.customer")}</h3>
          <p className="text-muted small mb-1">{t("sales.customerOptional")}</p>
          <CustomerSearch
            onSelectCustomer={handleSelectCustomer}
            selectedCustomer={selectedCustomer}
          />
        </div>
        <h3 className="section-title">{t("sales.products")}</h3>
        <ProductSearch onSelectProduct={addToCart} />
      </div>
      <div className="sales-sidebar">
        <Cart
          items={cart}
          onRemove={removeFromCart}
          onUpdateQuantity={updateQuantity}
          total={total}
          onFinalize={handleFinalizeSale}
        />
      </div>
    </div>
  );
}
