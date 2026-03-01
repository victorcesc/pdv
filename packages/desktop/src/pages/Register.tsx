import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/auth";
import { t } from "../i18n";
import Modal from "../components/Modal";
import "../styles/components.css";

export default function Register() {
  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registrationKey, setRegistrationKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!login.trim()) {
      setError(t("register.loginRequired") || "O login é obrigatório");
      return;
    }

    if (login.length < 3) {
      setError(t("register.loginTooShort") || "O login deve ter pelo menos 3 caracteres");
      return;
    }

    if (/\s/.test(login)) {
      setError(t("register.loginNoSpaces") || "O login não pode conter espaços");
      return;
    }

    if (password !== confirmPassword) {
      setError(t("register.passwordMismatch") || "As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError(t("register.passwordTooShort") || "A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (!registrationKey.trim()) {
      setError(t("register.keyRequired") || "A chave de registro é obrigatória");
      return;
    }

    setLoading(true);

    try {
      await register({
        name,
        login,
        email: email || undefined,
        password,
        registrationKey: registrationKey.trim(),
      });
      // Mostrar modal de sucesso ao invés de redirecionar imediatamente
      setShowSuccessModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card register-card">
        <div className="login-header">
          <h1 className="login-title">{t("register.title") || "Criar Conta"}</h1>
          <p className="login-subtitle">{t("register.subtitle") || "Preencha os dados para criar sua conta"}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              {t("register.name") || "Nome"}
            </label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              autoComplete="name"
              placeholder="Seu nome completo"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("register.login") || "Login"} *
            </label>
            <input
              type="text"
              className="form-control"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              disabled={loading}
              autoComplete="username"
              placeholder="seu_login"
            />
            <small className="form-text-hint">
              {t("register.loginHint") || "Usado para fazer login no sistema"}
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("register.email") || "Email"} <span style={{ color: '#999', fontSize: '0.9em' }}>(opcional)</span>
            </label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              placeholder="seu@email.com"
            />
            <small className="form-text-hint">
              {t("register.emailHint") || "Apenas para contato (opcional)"}
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("register.password") || "Senha"}
            </label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
              minLength={6}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("register.confirmPassword") || "Confirmar Senha"}
            </label>
            <input
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
              minLength={6}
              placeholder="Digite a senha novamente"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("register.registrationKey") || "Chave de Registro"} *
            </label>
            <input
              type="text"
              className="form-control registration-key-input"
              value={registrationKey}
              onChange={(e) => setRegistrationKey(e.target.value)}
              required
              disabled={loading}
              placeholder={t("register.keyPlaceholder") || "Digite a chave fornecida"}
            />
            <small className="form-text-hint">
              {t("register.keyHint") || "Chave única fornecida pelo desenvolvedor"}
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-button"
            disabled={loading}
          >
            {loading ? (t("register.loading") || "Criando conta...") : (t("register.submit") || "Criar Conta")}
          </button>

          <div className="login-footer">
            <Link to="/login" className="login-link">
              {t("register.alreadyHaveAccount") || "Já tem uma conta? Faça login"}
            </Link>
          </div>
        </form>
      </div>

      {/* Modal de confirmação de registro */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate("/");
        }}
        title={t("register.successTitle") || "Conta criada com sucesso!"}
        message={t("register.successMessage") || "Sua conta foi criada com sucesso. Você já pode fazer login e começar a usar o sistema."}
        confirmText={t("register.successButton") || "Entendi, obrigado!"}
        showCloseButton={false}
      />
    </div>
  );
}

