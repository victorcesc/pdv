import type { CartProps } from "../types";
import { t } from "../i18n";
import "../styles/components.css";

export default function Cart({
  items,
  onRemove,
  onUpdateQuantity,
  total,
  onFinalize,
}: CartProps) {
  return (
    <div className="cart-container">
      <h3 className="section-title">{t("cart.title")}</h3>
      {items.length === 0 ? (
        <p className="cart-empty">{t("cart.empty")}</p>
      ) : (
        <>
          <div className="mb-2">
            {items.map((item) => (
              <div key={item.product.id} className="cart-item">
                <div className="cart-item-header">
                  <div>
                    <strong>{item.product.name}</strong>
                    <br />
                    <small>
                      R$ {item.product.price.toFixed(2)} x {item.quantity}
                    </small>
                  </div>
                  <div>
                    <strong>R$ {item.subtotal.toFixed(2)}</strong>
                  </div>
                </div>
                <div className="cart-item-controls">
                  <button
                    onClick={() =>
                      onUpdateQuantity(item.product.id!, item.quantity - 1)
                    }
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      onUpdateQuantity(item.product.id!, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                  <button 
                    className="btn btn-danger btn-small"
                    onClick={() => onRemove(item.product.id!)}
                  >
                    {t("cart.remove")}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-total">
            <div className="cart-total-row">
              <strong>{t("cart.total")}</strong>
              <strong>R$ {total.toFixed(2)}</strong>
            </div>
            <button
              onClick={onFinalize}
              className="cart-finalize-button"
            >
              {t("cart.finalize")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
