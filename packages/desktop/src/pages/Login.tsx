import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { t } from "../i18n";
import "../styles/components.css";

export default function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login: loginFn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginFn({ login, password });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">{t("login.title") || "Login"}</h1>
          <p className="login-subtitle">{t("login.subtitle") || "Entre com suas credenciais"}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              {t("login.login") || "Login"}
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
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("login.password") || "Senha"}
            </label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-button"
            disabled={loading}
          >
            {loading ? (t("login.loading") || "Entrando...") : (t("login.submit") || "Entrar")}
          </button>

          <div className="login-footer">
            <Link to="/register" className="login-link">
              {t("login.createAccount") || "Não tem uma conta? Criar conta"}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

