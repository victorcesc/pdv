import { Link, useLocation } from "react-router-dom";
import type { LayoutProps } from "../types";
import "../styles/components.css";
import { t } from "../i18n";
import { useAuth } from "../contexts/AuthContext";

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>PDV - Sistema de Vendas</h1>
        <nav className="app-nav">
          <Link 
            to="/" 
            className={`app-nav-link ${location.pathname === "/" ? "active" : ""}`}
          >
            {t("home.title")}
          </Link>
          <Link 
            to="/sales" 
            className={`app-nav-link ${location.pathname === "/sales" ? "active" : ""}`}
          >
            {t("sales.title")}
          </Link>
          <Link
            to="/products"
            className={`app-nav-link ${location.pathname === "/products" ? "active" : ""}`}
          >
            {t("products.title")}
          </Link>
          <Link
            to="/customers"
            className={`app-nav-link ${location.pathname === "/customers" ? "active" : ""}`}
          >
            {t("customers.title")}
          </Link>
          <Link
            to="/credit-sales"
            className={`app-nav-link ${location.pathname === "/credit-sales" ? "active" : ""}`}
          >
            {t("creditSales.title")}
          </Link>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "1rem" }}>
            {user && (
              <span style={{ color: "#fff", fontSize: "0.9rem" }}>
                {user.name || user.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
            >
              Sair
            </button>
          </div>
        </nav>
      </header>
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
