import { useState } from "react";
import { Link } from "react-router-dom";
import { t, getLocale, setLocale, type Locale } from "../i18n";
import { useAuth } from "../contexts/AuthContext";
import "../styles/components.css";

/**
 * Extrai o primeiro nome de uma string de nome completo
 */
function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || "";
}

export default function Home(): JSX.Element {
  const [currentLocale, setCurrentLocale] = useState<Locale>(getLocale());
  const { user } = useAuth();
  const firstName = getFirstName(user?.name);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const newLocale = e.target.value as Locale;
    setLocale(newLocale);
    setCurrentLocale(newLocale);
    // Force page reload to update all translations
    window.location.reload();
  };

  // Montar a mensagem de boas-vindas
  const welcomeMessage = firstName 
    ? `${t("home.welcome")} ${firstName}` 
    : t("home.title");

  return (
    <div className="home-container">
      <div className="language-selector">
        <label htmlFor="language-select">{t("home.selectLanguage")}</label>
        <select
          id="language-select"
          className="form-select"
          value={currentLocale}
          onChange={handleLanguageChange}
        >
          <option value="pt-BR">{t("home.language.pt-BR")}</option>
          <option value="en">{t("home.language.en")}</option>
        </select>
      </div>

      <h2 className="home-title">{welcomeMessage}</h2>
      <p className="home-subtitle">{t("home.subtitle")}</p>
      {/* <div className="home-nav">
        <Link
          to="/sales"
          className="home-nav-link"
          style={{ background: "#3498db" }}
        >
          {t("home.newSale")}
        </Link>
        <Link
          to="/products"
          className="home-nav-link"
          style={{ background: "#2ecc71" }}
        >
          {t("home.products")}
        </Link>
        <Link
          to="/customers"
          className="home-nav-link"
          style={{ background: "#9b59b6" }}
        >
          {t("home.customers")}
        </Link>
        <Link
          to="/credit-sales"
          className="home-nav-link"
          style={{ background: "#e67e22" }}
        >
          {t("home.creditSales")}
        </Link>
      </div> */}
    </div>
  );
}
