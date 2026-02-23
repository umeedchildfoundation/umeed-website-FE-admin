import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { User, Session } from "@/lib/authService";

type AppRole = "volunteer" | "admin" | "super_admin";
type VolunteerStatus = "pending" | "approved" | "rejected" | "inactive" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  volunteerId: string | null;
  volunteerStatus: VolunteerStatus;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [volunteerId, setVolunteerId] = useState<string | null>(null);
  const [volunteerStatus, setVolunteerStatus] = useState<VolunteerStatus>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = api.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use role directly from session (local authService includes it)
          const userRole = (session.user as any).role as AppRole;
          if (userRole) {
            setRole(userRole);
          } else {
            // Fallback: fetch from database if not in session
            fetchUserRole(session.user.id, session.user.email);
          }
          fetchVolunteerId(session.user.id);
        } else {
          setRole(null);
          setVolunteerId(null);
          setVolunteerStatus(null);
        }

        setLoading(false);
      }
    );

    // Check for existing session
    api.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Use role directly from session
        const userRole = (session.user as any).role as AppRole;
        if (userRole) {
          setRole(userRole);
        } else {
          fetchUserRole(session.user.id, session.user.email);
        }
        fetchVolunteerId(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string, email?: string) => {
    // Override for super admin
    if (email === "preet@umeed.org") {
      console.log("Forcing super_admin role for:", email);
      setRole("super_admin");
      return;
    }

    try {
      const { data, error } = await api
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        // Fallback: try to get role from users table
        const { data: userData } = await api
          .from("users")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        setRole((userData?.role as AppRole) || "volunteer");
        return;
      }
      setRole(data?.role as AppRole | null);
    } catch (err) {
      console.error("Error fetching user role:", err);
    }
  };

  const fetchVolunteerId = async (userId: string) => {
    try {
      const { data, error } = await api
        .from("volunteers")
        .select("id, status")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching volunteer id:", error);
        return;
      }
      setVolunteerId(data?.id ?? null);
      setVolunteerStatus(data?.status as VolunteerStatus ?? null);
    } catch (err) {
      console.error("Error fetching volunteer id:", err);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await api.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await api.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      const { error } = await api.auth.signOut();
      if (error) {
        await api.auth.signOut({ scope: "local" });
      }
    } catch {
      await api.auth.signOut({ scope: "local" });
    } finally {
      setUser(null);
      setSession(null);
      setRole(null);
      setVolunteerId(null);
      setVolunteerStatus(null);
    }
  };

  const roleLower = role?.toLowerCase();
  const isAdmin = roleLower === "admin" || roleLower === "super_admin";
  const isSuperAdmin = roleLower === "super_admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        volunteerId,
        volunteerStatus,
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
