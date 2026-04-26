import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/lib/notifications";
import type { User } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (data: {
    email: string;
    password: string;
    username: string;
    firstName: string;
    lastName: string;
    referralCode?: string;
  }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    setProfile(data);
    return data;
  };

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    setIsAdmin(!!data);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await checkAdmin(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(async () => {
            await fetchProfile(currentUser.id);
            await checkAdmin(currentUser.id);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id).then(() => {
          checkAdmin(currentUser.id).then(() => setLoading(false));
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const register = async (data: {
    email: string;
    password: string;
    username: string;
    firstName: string;
    lastName: string;
    referralCode?: string;
  }) => {
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
          first_name: data.firstName,
          last_name: data.lastName,
          referral_code: data.referralCode || "",
        },
      },
    });
    if (error) return { error: error.message };

    // Send welcome notification + email.
    // We delay 2 s so the DB trigger has time to create the profile row
    // before the edge function tries to look it up.
    const newUserId = signUpData?.user?.id;
    if (newUserId) {
      setTimeout(() => {
        sendNotification({
          userId: newUserId,
          type: "welcome",
          title: "Welcome to EntreVault! 🎉",
          message: `Hi ${data.firstName || "there"}, your registration has been received and is under review. We'll notify you as soon as an admin approves your account.`,
          link: "/dashboard",
        });
      }, 2000);
    }

    return {};
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
