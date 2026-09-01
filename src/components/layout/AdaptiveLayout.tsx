import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "./AppLayout";
import { PublicLayout } from "./PublicLayout";

/** Renders the signed-in app shell for authenticated users and the marketing shell otherwise. */
export function AdaptiveLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AppLayout>{children}</AppLayout> : <PublicLayout>{children}</PublicLayout>;
}
