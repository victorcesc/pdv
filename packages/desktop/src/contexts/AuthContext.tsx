import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { login as authLogin, logout as authLogout, getCurrentUser, isAuthenticated, type User, type LoginCredentials } from "../services/auth";
import { syncInitialData } from "../services/sync";
import { invoke } from "@tauri-apps/api/tauri";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuth: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const authenticated = await isAuthenticated();
      if (authenticated) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    const response = await authLogin(credentials);
    
    // SEMPRE limpar dados locais no login para garantir isolamento entre usuários
    // O banco local funciona como cache offline do usuário logado
    // O servidor é a fonte de verdade e filtra por userId
    console.log("[AUTH] Limpando dados locais para garantir isolamento do usuário...");
      try {
        await invoke("clear_local_data");
        console.log("[AUTH] ✅ Dados locais limpos");
      } catch (error) {
        console.error("[AUTH] ⚠️ Erro ao limpar dados locais:", error);
        // Continuar mesmo se houver erro
    }
    
    setUser(response.user);
    
    // Sincronizar dados após login bem-sucedido (não-bloqueante)
    // Baixa apenas os dados do usuário logado do servidor
    console.log("[AUTH] Login bem-sucedido, iniciando sincronização em background...");
    syncInitialData()
      .then(() => {
        console.log("[AUTH] ✅ Sincronização concluída");
      })
      .catch((error) => {
        console.error("[AUTH] ⚠️ Erro na sincronização (não bloqueia login):", error);
        // Não bloqueia o login se a sincronização falhar
        // O usuário pode continuar trabalhando offline
      });
  };

  const logout = async () => {
    await authLogout();
    setUser(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuth: !!user,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

