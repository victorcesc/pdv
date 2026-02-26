import { useState } from "react";
import { Link } from "react-router-dom";
import { t, getLocale, setLocale, type Locale } from "../i18n";
import "../styles/components.css";

export default function Home(): JSX.Element {
  const [currentLocale, setCurrentLocale] = useState<Locale>(getLocale());

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const newLocale = e.target.value as Locale;
    setLocale(newLocale);
    setCurrentLocale(newLocale);
    // Force page reload to update all translations
    window.location.reload();
  };

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

      <h2 className="home-title">{t("home.title")}</h2>
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
