import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: string;
  email: string;
  role: "agent" | "admin";
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<{ user: AuthUser }> => {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    return response.json();
  },

  logout: async (): Promise<void> => {
    await apiRequest("POST", "/api/auth/logout");
  },

  getMe: async (): Promise<{ user: AuthUser }> => {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  },
};
