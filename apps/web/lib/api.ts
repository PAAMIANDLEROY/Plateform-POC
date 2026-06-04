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

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UserResponse {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_verified: boolean;
  school: string;
  bio: string;
  avatar_url: string | null;
  linkedin: string;
  github: string;
  is_profile_complete: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface VideoResponse {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  youtube_id: string | null;
  thumbnail_url: string | null;
  category: string | null;
  school: string | null;
  tags: string[];
  visibility: string;
  duration_seconds: number;
  view_count: number;
  created_by: string;
  created_at: string;
}

export interface CourseBlockResponse {
  id: string;
  course_id: string;
  position: number;
  type: string;
  content: Record<string, unknown>;
}

export interface CourseResponse {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  category: string | null;
  tags: string[];
  level: string;
  school: string | null;
  status: string;
  estimated_duration_minutes: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  blocks: CourseBlockResponse[];
}

export interface MOOCResponse {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  school: string | null;
  status: string;
  is_linear: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  modules: unknown[];
  enrolled_count: number;
}

export interface AppResponse {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  tags: string[];
  school: string | null;
  visibility: string;
  created_by: string;
  created_at: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
  is_new: boolean;
}

export const authApi = {
  requestCode: (email: string) =>
    request<{ message: string }>("/api/v1/auth/request-code", { method: "POST", body: JSON.stringify({ email }) }),

  verifyCode: (email: string, code: string) =>
    request<AuthResponse>("/api/v1/auth/verify-code", { method: "POST", body: JSON.stringify({ email, code }) }),

  logout: () => request<{ message: string }>("/api/v1/auth/logout", { method: "POST" }),

  refresh: () => request<AuthResponse>("/api/v1/auth/refresh", { method: "POST" }),

  me: () => request<UserResponse>("/api/v1/users/me"),

  updateProfile: (data: Partial<UserResponse>) =>
    request<UserResponse>("/api/v1/users/me", { method: "PUT", body: JSON.stringify(data) }),

  getMyData: () => request<Record<string, unknown>>("/api/v1/users/me/data"),

  exportMyData: () =>
    fetch(`${API_URL}/api/v1/users/me/export`, { credentials: "include" }).then((r) => r.blob()),

  deleteMe: () => request<void>("/api/v1/users/me", { method: "DELETE" }),

  updateConsent: (analytics: boolean, tracking: boolean) =>
    request<UserResponse>("/api/v1/users/me/consent", {
      method: "PUT",
      body: JSON.stringify({ analytics, tracking }),
    }),

  getConsent: () => request<{ analytics: boolean; tracking: boolean; updated_at: string | null }>("/api/v1/users/me/consent"),
};

// ─── Videos ──────────────────────────────────────────────────────────────────

export const videosApi = {
  list: (params?: { category?: string; school?: string; search?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.school) q.set("school", params.school);
    if (params?.search) q.set("search", params.search);
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));
    return request<VideoResponse[]>(`/api/v1/videos?${q}`);
  },
  get: (id: string) => request<VideoResponse>(`/api/v1/videos/${id}`),
  create: (data: Partial<VideoResponse>) =>
    request<VideoResponse>("/api/v1/videos", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<VideoResponse>) =>
    request<VideoResponse>(`/api/v1/videos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/v1/videos/${id}`, { method: "DELETE" }),
  addComment: (id: string, content: string) =>
    request(`/api/v1/videos/${id}/comments`, { method: "POST", body: JSON.stringify({ content }) }),
  listComments: (id: string) => request(`/api/v1/videos/${id}/comments`),
};

// ─── Courses ─────────────────────────────────────────────────────────────────

export const coursesApi = {
  list: (params?: { category?: string; level?: string; school?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.level) q.set("level", params.level);
    if (params?.school) q.set("school", params.school);
    if (params?.search) q.set("search", params.search);
    return request<CourseResponse[]>(`/api/v1/courses?${q}`);
  },
  mine: () => request<CourseResponse[]>("/api/v1/courses/mine"),
  get: (id: string) => request<CourseResponse>(`/api/v1/courses/${id}`),
  create: (data: unknown) =>
    request<CourseResponse>("/api/v1/courses", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: unknown) =>
    request<CourseResponse>(`/api/v1/courses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateBlocks: (id: string, blocks: unknown[]) =>
    request(`/api/v1/courses/${id}/blocks`, { method: "PUT", body: JSON.stringify(blocks) }),
  updateProgress: (id: string, completedBlockId: string) =>
    request(`/api/v1/courses/${id}/progress`, { method: "POST", body: JSON.stringify({ completed_block_id: completedBlockId }) }),
};

// ─── MOOCs ───────────────────────────────────────────────────────────────────

export const moocsApi = {
  list: (params?: { school?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.school) q.set("school", params.school);
    if (params?.search) q.set("search", params.search);
    return request<MOOCResponse[]>(`/api/v1/moocs?${q}`);
  },
  get: (id: string) => request<MOOCResponse>(`/api/v1/moocs/${id}`),
  create: (data: unknown) =>
    request<MOOCResponse>("/api/v1/moocs", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: unknown) =>
    request<MOOCResponse>(`/api/v1/moocs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  enroll: (id: string) =>
    request(`/api/v1/moocs/${id}/enroll`, { method: "POST" }),
  getProgress: (id: string) =>
    request(`/api/v1/moocs/${id}/progress`),
};

// ─── Apps ────────────────────────────────────────────────────────────────────

export const appsApi = {
  list: (params?: { school?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.school) q.set("school", params.school);
    if (params?.search) q.set("search", params.search);
    return request<AppResponse[]>(`/api/v1/apps?${q}`);
  },
  get: (id: string) => request<AppResponse>(`/api/v1/apps/${id}`),
  create: (data: unknown) =>
    request<AppResponse>("/api/v1/apps", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: unknown) =>
    request<AppResponse>(`/api/v1/apps/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/v1/apps/${id}`, { method: "DELETE" }),
};
