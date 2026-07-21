import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi, type AuthUser } from "../../services/authApi";

const SESSION_KEY = "umeed-auth-session";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  volunteerId: string | null;
  volunteerStatus: string | null;
  loading: boolean;
  error: string | null;
}

function loadFromStorage(): Pick<AuthState, "user" | "token"> {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return { user: null, token: null };
    const parsed = JSON.parse(raw);
    // Validate JWT format (3 dot-separated parts)
    if (parsed.access_token?.split(".").length !== 3) {
      localStorage.removeItem(SESSION_KEY);
      return { user: null, token: null };
    }
    return { user: parsed.user ?? null, token: parsed.access_token };
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return { user: null, token: null };
  }
}

function saveToStorage(user: AuthUser, token: string) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      user,
      access_token: token,
      expires_at: Date.now() + 24 * 60 * 60 * 1000,
    }),
  );
}

// ── Thunks ────────────────────────────────────────────────────────────────────

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const data = await authApi.login(email, password);
      saveToStorage(data.user, data.token);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.error ?? err.message ?? "Login failed",
      );
    }
  },
);

export const registerThunk = createAsyncThunk(
  "auth/register",
  async (
    {
      email,
      password,
      fullName,
    }: { email: string; password: string; fullName: string },
    { rejectWithValue },
  ) => {
    try {
      const data = await authApi.register(email, password, fullName);
      saveToStorage(data.user, data.token);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.error ?? err.message ?? "Registration failed",
      );
    }
  },
);

export const updateUserThunk = createAsyncThunk(
  "auth/updateUser",
  async (
    payload: {
      fullName?: string;
      avatarUrl?: string;
      preferences?: Record<string, unknown>;
    },
    { getState, rejectWithValue },
  ) => {
    try {
      const updated = await authApi.updateMe(payload);
      // Persist updated user in storage
      const state = (getState() as { auth: AuthState }).auth;
      if (state.token) saveToStorage(updated, state.token);
      return updated;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.error ?? err.message ?? "Update failed",
      );
    }
  },
);

export const changePasswordThunk = createAsyncThunk(
  "auth/changePassword",
  async (
    {
      currentPassword,
      newPassword,
    }: { currentPassword: string; newPassword: string },
    { rejectWithValue },
  ) => {
    try {
      return await authApi.changePassword(currentPassword, newPassword);
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.error ?? err.message ?? "Password change failed",
      );
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const { user: storedUser, token: storedToken } = loadFromStorage();

const initialState: AuthState = {
  user: storedUser,
  token: storedToken,
  volunteerId: storedUser?.volunteerId ?? null,
  volunteerStatus: storedUser?.volunteerStatus ?? null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      localStorage.removeItem(SESSION_KEY);
      state.user = null;
      state.token = null;
      state.volunteerId = null;
      state.volunteerStatus = null;
      state.error = null;
    },
    setVolunteerInfo(
      state,
      action: {
        payload: { volunteerId: string | null; volunteerStatus: string | null };
      },
    ) {
      state.volunteerId = action.payload.volunteerId;
      state.volunteerStatus = action.payload.volunteerStatus;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // login
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.volunteerId = action.payload.user.volunteerId ?? null;
        state.volunteerStatus = action.payload.user.volunteerStatus ?? null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // register
    builder
      .addCase(registerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // updateUser
    builder.addCase(updateUserThunk.fulfilled, (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    });
  },
});

export const { logout, setVolunteerInfo, clearError } = authSlice.actions;
export default authSlice.reducer;
