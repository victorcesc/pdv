import { invoke } from "@tauri-apps/api/tauri";

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface RegisterCredentials {
  login: string;
  email?: string;
  password: string;
  name: string;
  registrationKey: string;
  // Dados da empresa (obrigatórios)
  cnpj: string;
  razaoSocial: string;
  uf: string;
  nomeFantasia?: string;
  ie?: string;
  endereco?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    login: string;
    email?: string | null;
    name: string;
  };
}

export interface User {
  id: number;
  login: string;
  email?: string | null;
  name: string;
}

const API_BASE_URL = "http://localhost:8000";

/**
 * Timeout para requisições de autenticação (10 segundos)
 * Login precisa de internet, mas não deve demorar muito
 */
const AUTH_TIMEOUT = 10000;

/**
 * Fetch com timeout para evitar esperas longas sem internet
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = AUTH_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Timeout: Sem resposta do servidor. Verifique sua conexão.");
    }
    throw error;
  }
}

// Store token using Tauri store (or fallback to localStorage)
async function setToken(token: string): Promise<void> {
  try {
    // Try using Tauri store first
    await invoke("set_auth_token", { token });
  } catch {
    // Fallback to localStorage if Tauri command doesn't exist yet
    localStorage.setItem("auth_token", token);
  }
}

async function getToken(): Promise<string | null> {
  try {
    // Tauri retorna Option<String>, que pode ser null
    const token: string | null = await invoke("get_auth_token");
    if (token && typeof token === "string" && token.trim()) {
      const trimmedToken = token.trim();
      console.log("[AUTH] Token recuperado do Tauri (primeiros 30 chars):", trimmedToken.substring(0, 30) + "...");
      return trimmedToken;
    }
    console.log("[AUTH] Token não encontrado no Tauri, tentando localStorage...");
  } catch (error) {
    console.error("[AUTH] Erro ao recuperar token do Tauri:", error);
  }
  
  // Fallback to localStorage
  try {
    const localToken = localStorage.getItem("auth_token");
    if (localToken && localToken.trim()) {
      console.log("[AUTH] Token recuperado do localStorage (primeiros 30 chars):", localToken.substring(0, 30) + "...");
      return localToken.trim();
    }
  } catch (error) {
    console.error("[AUTH] Erro ao acessar localStorage:", error);
  }
  
  console.warn("[AUTH] ⚠️ Nenhum token encontrado");
  return null;
}

async function removeToken(): Promise<void> {
  try {
    await invoke("remove_auth_token");
  } catch {
    localStorage.removeItem("auth_token");
  }
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    },
    AUTH_TIMEOUT
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Login failed" }));
    throw new Error(error.message || "Erro ao fazer login");
  }

  const data: AuthResponse = await response.json();
  console.log("[AUTH] Token recebido do servidor (primeiros 30 chars):", data.token.substring(0, 30) + "...");
  await setToken(data.token);
  
  // Verificar se o token foi salvo corretamente
  const savedToken = await getToken();
  if (savedToken) {
    console.log("[AUTH] ✅ Token salvo e verificado (primeiros 30 chars):", savedToken.substring(0, 30) + "...");
  } else {
    console.error("[AUTH] ❌ Token não foi salvo corretamente!");
  }
  
  return data;
}

export async function logout(): Promise<void> {
  await removeToken();
}

export async function getCurrentUser(): Promise<User | null> {
  const token = await getToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      AUTH_TIMEOUT
    );

    if (!response.ok) {
      await removeToken();
      return null;
    }

    return await response.json();
  } catch {
    await removeToken();
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}

export async function getAuthToken(): Promise<string | null> {
  return getToken();
}

export async function register(credentials: RegisterCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Registration failed" }));
    throw new Error(error.message || "Erro ao criar conta");
  }

  const data: AuthResponse = await response.json();
  await setToken(data.token);
  return data;
}

