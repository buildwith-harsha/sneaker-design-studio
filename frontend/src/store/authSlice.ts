import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { loginApi, registerApi, getMeApi } from "../api/authApi";
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
} from "../types/auth";
import axios from "axios";

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  initialAuthChecked: boolean;
  error: string | null;
}

const initialToken = localStorage.getItem("token");

const initialState: AuthState = {
  user: null,
  token: initialToken,
  isAuthenticated: !!initialToken,
  loading: false,
  initialAuthChecked: !initialToken,
  error: null,
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export const loginUser = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const data = await loginApi(credentials);
    localStorage.setItem("token", data.token);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Login failed."));
  }
});

export const registerUser = createAsyncThunk<
  AuthResponse,
  RegisterCredentials,
  { rejectValue: string }
>("auth/register", async (credentials, { rejectWithValue }) => {
  try {
    const data = await registerApi(credentials);
    localStorage.setItem("token", data.token);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Registration failed."));
  }
});

export const checkAuth = createAsyncThunk<
  AuthUser,
  void,
  { rejectValue: string }
>("auth/checkAuth", async (_, { rejectWithValue }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return rejectWithValue("No token found");
  }

  try {
    const user = await getMeApi();
    return user;
  } catch (error) {
    localStorage.removeItem("token");
    return rejectWithValue(getErrorMessage(error, "Session expired."));
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem("token");
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.initialAuthChecked = true;
      state.error = null;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    // login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.initialAuthChecked = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload || "Login failed.";
      });

    // register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.initialAuthChecked = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload || "Registration failed.";
      });

    // checkAuth
    builder
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.initialAuthChecked = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.initialAuthChecked = true;
      });
  },
});

export const { logout, clearAuthError, setUser } = authSlice.actions;
export default authSlice.reducer;
