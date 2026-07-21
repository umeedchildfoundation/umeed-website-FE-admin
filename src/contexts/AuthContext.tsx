import React, { createContext, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store/store";
import {
  loginThunk,
  registerThunk,
  logout,
  setVolunteerInfo,
} from "../store/slices/authSlice";
import { volunteersApi } from "../services/volunteersApi";
import type { AuthUser } from "../services/authApi";

type AppRole = "volunteer" | "admin" | "super_admin";
type VolunteerStatus = "pending" | "approved" | "rejected" | "inactive" | null;

interface AuthContextType {
  user: AuthUser | null;
  role: AppRole | null;
  volunteerId: string | null;
  volunteerStatus: VolunteerStatus;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const { user, volunteerId, volunteerStatus, loading } = useSelector(
    (state: RootState) => state.auth,
  );

  // Fetch volunteer profile link whenever user changes
  useEffect(() => {
    if (!user) return;

    volunteersApi
      .getAll({ user_id: user.id })
      .then((vols) => {
        const v = vols[0] ?? null;
        dispatch(
          setVolunteerInfo({
            volunteerId: v?.id ?? null,
            volunteerStatus: v?.status ?? null,
          }),
        );
      })
      .catch(() => {
        // non-critical – silently ignore
      });
  }, [user?.id, dispatch]);

  const signIn = async (email: string, password: string) => {
    const result = await dispatch(loginThunk({ email, password }));
    if (loginThunk.rejected.match(result)) {
      return { error: new Error(result.payload as string) };
    }
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
  ) => {
    const result = await dispatch(registerThunk({ email, password, fullName }));
    if (registerThunk.rejected.match(result)) {
      return { error: new Error(result.payload as string) };
    }
    return { error: null };
  };

  const signOut = () => {
    dispatch(logout());
  };

  const role = (user?.role as AppRole) ?? null;
  const roleLower = role?.toLowerCase();
  const isAdmin = roleLower === "admin" || roleLower === "super_admin";
  const isSuperAdmin = roleLower === "super_admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        volunteerId,
        volunteerStatus: volunteerStatus as VolunteerStatus,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin,
        isSuperAdmin,
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
