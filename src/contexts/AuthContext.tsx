import { createContext, useContext, useState, ReactNode } from "react";
import { mockUser, mockAdminUser } from "@/lib/mock-data";

type User = typeof mockUser;

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: Record<string, string>) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, _password: string) => {
    // Mock login - will be replaced with Lovable Cloud auth
    if (email === "admin@gmail.com") {
      setUser(mockAdminUser);
    } else {
      setUser(mockUser);
    }
    return true;
  };

  const register = async (_data: Record<string, string>) => {
    setUser({ ...mockUser, registrationStatus: "pending" });
    return true;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.isAdmin ?? false,
        isAuthenticated: !!user,
        login,
        register,
        logout,
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
