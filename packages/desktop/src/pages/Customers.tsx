import { useState, useEffect } from "react";
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../services/api";
import type { Customer, CustomerFormData } from "../types";
import {
  validateDocument,
  validatePhone,
  validateEmail,
  formatDocument,
  formatPhone,
} from "../utils/validations";
import { t } from "../i18n";
import "../styles/components.css";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    document: "",
    phone: "",
    email: "",
    address: "",
  });
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    document?: string;
    phone?: string;
    email?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async (): Promise<void> => {
    try {
      const result: Customer[] = await listCustomers();
      setCustomers(result);
    } catch (error: unknown) {
      console.error("Error loading customers:", error);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    
    // Limpar erros anteriores
    setSubmitError(null);
    
    // Validações
    const errors: {
      name?: string;
      document?: string;
      phone?: string;
      email?: string;
    } = {};
    
    // Validar nome (obrigatório)
    if (!formData.name || formData.name.trim() === "") {
      errors.name = t("customers.nameRequired");
    }
    
    if (formData.document && !validateDocument(formData.document)) {
      errors.document = t("customers.invalidDocument");
    }
    
    if (formData.phone && !validatePhone(formData.phone)) {
      errors.phone = t("customers.invalidPhone");
    }
    
    if (formData.email && !validateEmail(formData.email)) {
      errors.email = t("customers.invalidEmail");
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    // Limpar erros se tudo estiver válido
    setValidationErrors({});
    
    console.log("[FRONTEND] Form submitted, formData:", formData);
    try {
      if (editing) {
        console.log("[FRONTEND] Updating customer:", { ...formData, id: editing.id });
        const customerData: Customer = {
          ...formData,
          id: editing.id,
          active: editing.active ?? true,
        };
        await updateCustomer(customerData);
      } else {
        console.log("[FRONTEND] Creating customer:", formData);
        const customerData: Customer = {
          ...formData,
          active: true,
        };
        console.log("[FRONTEND] Customer data to send:", customerData);
        const result = await createCustomer(customerData);
        console.log("[FRONTEND] Customer created, result:", result);
      }
      setFormData({
        name: "",
        document: "",
        phone: "",
        email: "",
        address: "",
      });
      setEditing(null);
      setValidationErrors({});
      setSubmitError(null);
      loadCustomers();
    } catch (error: unknown) {
      console.error("[FRONTEND] Error saving customer:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setSubmitError(`${t("customers.saveError")} ${errorMessage}`);
      // Scroll para o topo do formulário para mostrar o erro
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleEdit = (customer: Customer): void => {
    setEditing(customer);
    setFormData({
      name: customer.name,
      document: customer.document || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
    });
    setValidationErrors({});
    setSubmitError(null);
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (confirm(t("customers.deleteConfirm"))) {
      try {
        await deleteCustomer(id);
        loadCustomers();
      } catch (error: unknown) {
        alert(`${t("customers.deleteError")} ${error}`);
      }
    }
  };

  return (
    <div className="container">
      <h2 className="page-title">{t("customers.title")}</h2>
      <div className="flex-container">
        <div className="flex-section">
          <h3 className="section-title">
            {editing ? t("customers.editCustomer") : t("customers.newCustomer")}
          </h3>
          {submitError && (
            <div className="error-message">
              <strong>{t("customers.saveError")}</strong> {submitError}
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">
                {t("customers.name")}
                <input
                  type="text"
                  className={`form-input ${validationErrors.name ? "error" : ""}`}
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setFormData({ ...formData, name: e.target.value });
                    // Limpar erro quando o usuário começar a digitar
                    if (validationErrors.name) {
                      setValidationErrors({ ...validationErrors, name: undefined });
                    }
                    if (submitError) {
                      setSubmitError(null);
                    }
                  }}
                  required
                />
              </label>
              {validationErrors.name && (
                <span className="validation-tooltip">{validationErrors.name}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">
                {t("customers.document")}
                <input
                  type="text"
                  className={`form-input ${validationErrors.document ? "error" : ""}`}
                  value={formData.document}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const formatted = formatDocument(e.target.value);
                    setFormData({ ...formData, document: formatted });
                    // Limpar erro quando o usuário começar a digitar
                    if (validationErrors.document) {
                      setValidationErrors({ ...validationErrors, document: undefined });
                    }
                    if (submitError) {
                      setSubmitError(null);
                    }
                  }}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                />
              </label>
              {validationErrors.document && (
                <span className="validation-tooltip">{validationErrors.document}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">
                {t("customers.phone")}
                <input
                  type="text"
                  className={`form-input ${validationErrors.phone ? "error" : ""}`}
                  value={formData.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const formatted = formatPhone(e.target.value);
                    setFormData({ ...formData, phone: formatted });
                    // Limpar erro quando o usuário começar a digitar
                    if (validationErrors.phone) {
                      setValidationErrors({ ...validationErrors, phone: undefined });
                    }
                    if (submitError) {
                      setSubmitError(null);
                    }
                  }}
                  placeholder="(00) 00000-0000"
                />
              </label>
              {validationErrors.phone && (
                <span className="validation-tooltip">{validationErrors.phone}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">
                {t("customers.email")}
                <input
                  type="email"
                  className={`form-input ${validationErrors.email ? "error" : ""}`}
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setFormData({ ...formData, email: e.target.value });
                    // Limpar erro quando o usuário começar a digitar
                    if (validationErrors.email) {
                      setValidationErrors({ ...validationErrors, email: undefined });
                    }
                    if (submitError) {
                      setSubmitError(null);
                    }
                  }}
                  placeholder="exemplo@email.com"
                />
              </label>
              {validationErrors.email && (
                <span className="validation-tooltip">{validationErrors.email}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">
                {t("customers.address")}
                <textarea
                  className="form-textarea"
                  value={formData.address}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="btn-group">
              <button type="submit" className="btn btn-primary">
                {t("customers.save")}
              </button>
              {editing && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditing(null);
                    setFormData({
                      name: "",
                      document: "",
                      phone: "",
                      email: "",
                      address: "",
                    });
                    setValidationErrors({});
                    setSubmitError(null);
                  }}
                >
                  {t("customers.cancel")}
                </button>
              )}
            </div>
          </form>
        </div>
        <div className="flex-section">
          <h3 className="section-title">{t("customers.customerList")}</h3>
          <table className="table">
            <thead>
              <tr>
                <th>{t("customers.name").replace(":", "")}</th>
                <th>{t("customers.document").replace(":", "")}</th>
                <th>{t("customers.phone").replace(":", "")}</th>
                <th>{t("customers.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-empty">
                    {t("customers.noCustomers")}
                  </td>
                </tr>
              ) : (
                customers.map((customer: Customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.document || "-"}</td>
                    <td>{customer.phone || "-"}</td>
                    <td>
                      <button
                        onClick={() => handleEdit(customer)}
                        className="btn btn-primary btn-small mr-1"
                      >
                        {t("customers.edit")}
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id!)}
                        className="btn btn-danger btn-small"
                      >
                        {t("customers.delete")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
