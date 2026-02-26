import { invoke } from "@tauri-apps/api/tauri";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  registrationKey: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

export interface User {
  id: number;
  email: string;
  name: string;
}

const API_BASE_URL = "http://localhost:3000";

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
    const token = await invoke<string>("get_auth_token");
    return token || null;
  } catch {
    // Fallback to localStorage
    return localStorage.getItem("auth_token");
  }
}

async function removeToken(): Promise<void> {
  try {
    await invoke("remove_auth_token");
  } catch {
    localStorage.removeItem("auth_token");
  }
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Login failed" }));
    throw new Error(error.message || "Erro ao fazer login");
  }

  const data: AuthResponse = await response.json();
  await setToken(data.token);
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
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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

