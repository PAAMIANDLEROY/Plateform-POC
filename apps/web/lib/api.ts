const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail ?? "Unknown error");
  }

  return res.json();
}

export interface UserResponse {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_verified: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export const authApi = {
  register: (data: { first_name: string; last_name: string; email: string; password: string }) =>
    request<{ message: string }>("/api/v1/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<TokenResponse>("/api/v1/auth/login", { method: "POST", body: JSON.stringify(data) }),

  logout: () => request<{ message: string }>("/api/v1/auth/logout", { method: "POST" }),

  refresh: () => request<TokenResponse>("/api/v1/auth/refresh", { method: "POST" }),

  verifyEmail: (token: string) =>
    request<{ message: string }>("/api/v1/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) }),

  me: () => request<UserResponse>("/api/v1/users/me"),
};
