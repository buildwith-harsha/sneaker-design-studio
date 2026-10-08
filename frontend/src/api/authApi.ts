import api from "./api";
import type {
  AuthResponse,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  ApiResponse,
} from "../types/auth";

export async function loginApi(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>(
    "/auth/login",
    credentials,
  );
  return response.data.data;
}

export async function registerApi(
  credentials: RegisterCredentials,
): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>(
    "/auth/register",
    credentials,
  );
  return response.data.data;
}

export async function getMeApi(): Promise<AuthUser> {
  const response = await api.get<ApiResponse<AuthUser>>("/auth/me");
  return response.data.data;
}
