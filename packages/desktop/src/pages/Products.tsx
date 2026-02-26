import { useState, useEffect } from "react";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listDeletedProducts,
  reactivateProduct,
} from "../services/api";
import type { Product, ProductFormData } from "../types";
import { t } from "../i18n";
import "../styles/components.css";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [deletedProducts, setDeletedProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    code: "",
    name: "",
    price: "",
    description: "",
  });
  const [validationErrors, setValidationErrors] = useState<{
    code?: string;
    name?: string;
    price?: string;
  }>({});


  useEffect(() => {
    console.log('TESTE');
    loadProducts();
    loadDeletedProducts();
  }, []);

  const loadProducts = async (): Promise<void> => {
    try {
      const result: Product[] = await listProducts();
      setProducts(result);
    } catch (error: unknown) {
      console.error("Error loading products:", error);
    }
  };

  const loadDeletedProducts = async (): Promise<void> => {
    try {
      const result: Product[] = await listDeletedProducts();
      setDeletedProducts(result);
    } catch (error: unknown) {
      console.error("Error loading deleted products:", error);
    }
  };

  // Função helper para converter string monetária para number com arredondamento correto
  const parseMonetaryValue = (value: string): number => {
    if (!value || value.trim() === "") return 0;
    // Remove espaços e substitui vírgula por ponto
    const cleaned = value.trim().replace(/,/g, ".");
    const num = parseFloat(cleaned);
    if (isNaN(num)) return 0;
    // Arredonda para 2 casas decimais usando Math.round
    // Multiplica por 100, arredonda, divide por 100
    return Math.round(num * 100) / 100;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {

    e.preventDefault();
    setError(null);
    setValidationErrors({});

    // Validação customizada
    const errors: typeof validationErrors = {};
  
    if (!formData.code || formData.code.trim() === "") {
      errors.code = t("errors.PRODUCT_CODE_CANNOT_BE_EMPTY") || "Código é obrigatório";
    }
    if (!formData.name || formData.name.trim() === "") {
      errors.name = t("errors.PRODUCT_NAME_REQUIRED") || "Nome é obrigatório";
    }
    
    // Validar price como string
    // const priceValue = parseMonetaryValue(formData.price);
    // if (!formData.price || formData.price.trim() === "" || priceValue <= 0) {
    //   errors.price = t("errors.PRICE_CANNOT_BE_ZERO") || "Preço deve ser maior que zero";
    // }
  
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    try {
      // Converter price de string para number antes de enviar
      const priceNumber = parseMonetaryValue(formData.price);
      
      if (editing) {
        const productData: Product = {
          ...formData,
          price: priceNumber,
          id: editing.id,
          active: editing.active ?? true,
        };
        await updateProduct(productData);
      } else {
        const productData: Product = {
          ...formData,
          price: priceNumber,
          active: true,
        };
        const teste =   await createProduct(productData);
        console.log('teste', teste);
      }
      setFormData({ code: "", name: "", price: "", description: "" });
      setEditing(null);
      setError(null);
      setValidationErrors({});
      loadProducts();
      loadDeletedProducts();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      // Translate error message
      let translatedError = errorMessage;
      
      // Check if it's a known error key
      if (
        errorMessage.includes("UNIQUE constraint failed") || 
        errorMessage.includes("UNIQUE_CONSTRAINT_FAILED") ||
        errorMessage.includes("UNIQUE constraint")
      ) {
        translatedError = t("errors.UNIQUE_CONSTRAINT_FAILED");
      } else if (errorMessage.includes("PRODUCT_CODE_EXISTS_INACTIVE")) {
        translatedError = t("errors.PRODUCT_CODE_EXISTS_INACTIVE");
      } else if (errorMessage.includes("PRODUCT_CODE_ALREADY_EXISTS")) {
        translatedError = t("errors.PRODUCT_CODE_ALREADY_EXISTS");
      } else if (errorMessage.includes("PRODUCT_CODE_ALREADY_IN_USE")) {
        translatedError = t("errors.PRODUCT_CODE_ALREADY_IN_USE");
      } else if (errorMessage.includes("PRODUCT_CODE_CANNOT_BE_EMPTY")) {
        translatedError = t("errors.PRODUCT_CODE_CANNOT_BE_EMPTY");
      } else if (errorMessage.includes("PRICE_CANNOT_BE_NEGATIVE")) {
        translatedError = t("errors.PRICE_CANNOT_BE_NEGATIVE");
      } else if (errorMessage.includes("PRICE_CANNOT_BE_ZERO")) {
        translatedError = t("errors.PRICE_CANNOT_BE_ZERO");
      } else {
        // Try to translate if it's a known key
        const errorKey = errorMessage.trim();
        const translated = t(`errors.${errorKey}`);
        if (translated !== `errors.${errorKey}`) {
          translatedError = translated;
        }
      }
      
      setError(translatedError);
    }
  };

  const handleEdit = (product: Product): void => {
    setEditing(product);
    setError(null);
    setValidationErrors({});
    // Converter price de number para string com 2 casas decimais
    setFormData({
      code: product.code,
      name: product.name,
      price: product.price.toFixed(2),
      description: product.description || "",
    });
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    // Permite apenas números
    if (value === "" || /^\d+$/.test(value)) {
      setFormData({ ...formData, code: value });
      setError(null);
      // Limpar erro de validação quando o usuário começar a digitar
      if (validationErrors.code) {
        setValidationErrors({ ...validationErrors, code: undefined });
      }
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (confirm(t("products.deleteConfirm"))) {
      try {
        await deleteProduct(id);
        loadProducts();
        loadDeletedProducts();
      } catch (error: unknown) {
        alert(`${t("errors.PRODUCT_DELETE_ERROR")}: ${error}`);
      }
    }
  };

  const handleReactivate = async (id: number): Promise<void> => {
    if (confirm(t("products.reactivateConfirm"))) {
      try {
        await reactivateProduct(id);
        loadProducts();
        loadDeletedProducts();
        setActiveTab("active");
      } catch (error: unknown) {
        alert(`${t("errors.PRODUCT_REACTIVATE_ERROR")}: ${error}`);
      }
    }
  };

  return (
    <div className="container">
      <h2 className="page-title">{t("products.title")}</h2>
      <div className="flex-container">
        <div className="flex-section">
          <h3 className="section-title">
            {editing ? t("products.editProduct") : t("products.newProduct")}
          </h3>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">
                {t("products.code")}
                <input
                  type="text"
                  className={`form-input ${validationErrors.code ? "error" : ""}`}
                  value={formData.code}
                  onChange={handleCodeChange}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </label>
              {validationErrors.code && (
                <span className="validation-tooltip">{validationErrors.code}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">
                {t("products.name")}
                <input
                  type="text"
                  className={`form-input ${validationErrors.name ? "error" : ""}`}
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setFormData({ ...formData, name: e.target.value });
                    // Limpar erro de validação quando o usuário começar a digitar
                    if (validationErrors.name) {
                      setValidationErrors({ ...validationErrors, name: undefined });
                    }
                  }}
                />
              </label>
              {validationErrors.name && (
                <span className="validation-tooltip">{validationErrors.name}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">
                {t("products.price")}
                <input
                  type="text"
                  inputMode="decimal"
                  className={`form-input ${validationErrors.price ? "error" : ""}`}
                  value={formData.price}
                  placeholder="0.00"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    let value = e.target.value;
                    
                    // Remove caracteres inválidos (mantém apenas números, vírgula e ponto)
                    value = value.replace(/[^\d,.]/g, "");
                    
                    // Substitui vírgula por ponto (padrão internacional)
                    value = value.replace(/,/g, ".");
                    
                    // Remove múltiplos pontos, mantendo apenas o primeiro
                    const parts = value.split(".");
                    if (parts.length > 2) {
                      value = parts[0] + "." + parts.slice(1).join("");
                    }
                    
                    // Limita a 2 casas decimais após o ponto
                    if (parts.length === 2 && parts[1].length > 2) {
                      value = parts[0] + "." + parts[1].substring(0, 2);
                    }
                    
                    setFormData({
                      ...formData,
                      price: value,
                    });
                    // Limpar erros quando o usuário começar a digitar
                    if (error) setError(null);
                    if (validationErrors.price) {
                      setValidationErrors({ ...validationErrors, price: undefined });
                    }
                  }}
                />
              </label>
              {validationErrors.price && (
                <span className="validation-tooltip">{validationErrors.price}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">
                {t("products.description")}
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="btn-group">
              <button type="submit" className="btn btn-primary">
                {t("products.save")}
              </button>
              {editing && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditing(null);
                    setError(null);
                    setValidationErrors({});
                    setFormData({ code: "", name: "", price: "", description: "" });
                  }}
                >
                  {t("products.cancel")}
                </button>
              )}
            </div>
          </form>
        </div>
        <div className="flex-section">
          <div className="tab-group">
            <button
              onClick={() => setActiveTab("active")}
              className={`tab-button ${activeTab === "active" ? "active" : ""}`}
            >
              {t("products.activeProducts")} ({products.length})
            </button>
            <button
              onClick={() => setActiveTab("deleted")}
              className={`tab-button ${activeTab === "deleted" ? "active-danger" : ""}`}
            >
              {t("products.deletedProducts")} ({deletedProducts.length})
            </button>
          </div>

          {activeTab === "active" ? (
            <>
              <h3 className="section-title">{t("products.activeProductsList")}</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("products.code").replace(":", "")}</th>
                    <th>{t("products.name").replace(":", "")}</th>
                    <th>{t("products.price").replace(":", "")}</th>
                    <th>{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="table-empty">
                        {t("products.noActiveProducts")}
                      </td>
                    </tr>
                  ) : (
                    products.map((product: Product) => (
                      <tr key={product.id}>
                        <td>{product.code}</td>
                        <td>{product.name}</td>
                        <td>R$ {product.price.toFixed(2)}</td>
                        <td>
                          <button
                            onClick={() => handleEdit(product)}
                            className="btn btn-primary btn-small mr-1"
                          >
                            {t("products.edit")}
                          </button>
                          <button
                            onClick={() => handleDelete(product.id!)}
                            className="btn btn-danger btn-small"
                          >
                            {t("products.delete")}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          ) : (
            <>
              <h3 className="section-title">{t("products.deletedProductsList")}</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("products.code").replace(":", "")}</th>
                    <th>{t("products.name").replace(":", "")}</th>
                    <th>{t("products.price").replace(":", "")}</th>
                    <th>{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="table-empty">
                        {t("products.noDeletedProducts")}
                      </td>
                    </tr>
                  ) : (
                    deletedProducts.map((product: Product) => (
                      <tr key={product.id} className="disabled">
                        <td>{product.code}</td>
                        <td>{product.name}</td>
                        <td>R$ {product.price.toFixed(2)}</td>
                        <td>
                          <button
                            onClick={() => handleReactivate(product.id!)}
                            className="btn btn-success btn-small"
                          >
                            {t("products.reactivate")}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
