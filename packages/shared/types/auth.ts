export type UserRole = "student" | "teacher" | "admin" | "super_admin" | "public";

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  is_verified: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiMessage {
  message: string;
}
