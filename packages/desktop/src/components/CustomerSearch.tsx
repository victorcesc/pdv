import { useState, useEffect } from "react";
import { searchCustomers } from "../services/api";
import type { Customer, CustomerSearchProps } from "../types";
import { t } from "../i18n";
import "../styles/components.css";

export default function CustomerSearch({
  onSelectCustomer,
  selectedCustomer,
}: CustomerSearchProps) {
  const [query, setQuery] = useState<string>("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (query.length >= 2) {
      setLoading(true);
      searchCustomers(query)
        .then((results: Customer[]) => {
          setCustomers(results);
          setLoading(false);
        })
        .catch((error: unknown) => {
          console.error("Error searching customers:", error);
          setLoading(false);
        });
    } else {
      setCustomers([]);
    }
  }, [query]);

  const handleClearSelection = (): void => {
    setQuery("");
    setCustomers([]);
    if (onSelectCustomer) {
      onSelectCustomer(null);
    }
  };

  return (
    <div className="search-container">
      {selectedCustomer ? (
        <div className="selected-customer-card">
          <strong>{t("customerSearch.selectedCustomer")}</strong> {selectedCustomer.name}
          {selectedCustomer.document && (
            <>
              <br />
              <small>{t("customerSearch.document")} {selectedCustomer.document}</small>
            </>
          )}
          <button
            onClick={handleClearSelection}
            className="clear-button"
          >
            {t("customerSearch.clear")}
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            className="search-input"
            placeholder={t("customerSearch.searchPlaceholder")}
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setQuery(e.target.value)
            }
          />
          {loading && <p className="loading-text">{t("customerSearch.searching")}</p>}
          <div className="search-results">
            {customers.map((customer: Customer) => (
              <div
                key={customer.id}
                onClick={() => {
                  if (onSelectCustomer) {
                    onSelectCustomer(customer);
                  }
                  setQuery("");
                  setCustomers([]);
                }}
                className="search-result-item"
              >
                <strong>{customer.name}</strong>
                {customer.document && (
                  <>
                    <br />
                    <small>{t("customerSearch.document")} {customer.document}</small>
                  </>
                )}
                {customer.phone && (
                  <>
                    <br />
                    <small>{t("customerSearch.phone")} {customer.phone}</small>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

