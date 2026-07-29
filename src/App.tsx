import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import DashboardPage from "@/pages/DashboardPage";
import TasksPage from "@/pages/TasksPage";
import CoursesPage from "@/pages/CoursesPage";
import CourseDetailPage from "@/pages/CourseDetailPage";
import GuidesPage from "@/pages/GuidesPage";
import WalletPage from "@/pages/WalletPage";
import ProfilePage from "@/pages/ProfilePage";
import NotificationsPage from "@/pages/NotificationsPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminTasksPage from "@/pages/admin/AdminTasksPage";
import AdminCoursesPage from "@/pages/admin/AdminCoursesPage";
import AdminLessonsPage from "@/pages/admin/AdminLessonsPage";
import AdminGuidesPage from "@/pages/admin/AdminGuidesPage";
import AdminVerificationsPage from "@/pages/admin/AdminVerificationsPage";
import AdminTransactionsPage from "@/pages/admin/AdminTransactionsPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminBroadcastPage from "@/pages/admin/AdminBroadcastPage";
import NotFound from "@/pages/NotFound";
import HomePage from "@/pages/HomePage";
import OAuthConsentPage from "@/pages/OAuthConsentPage";


const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse-glow h-8 w-8 rounded-full gradient-primary" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function ApprovedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, loading, profile } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse-glow h-8 w-8 rounded-full gradient-primary" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin && profile?.registration_status !== "active") return <Navigate to="/dashboard" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse-glow h-8 w-8 rounded-full gradient-primary" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse-glow h-8 w-8 rounded-full gradient-primary" /></div>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<PublicRoute><HomePage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsentPage />} />

            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/tasks" element={<ApprovedRoute><TasksPage /></ApprovedRoute>} />
            <Route path="/courses" element={<ApprovedRoute><CoursesPage /></ApprovedRoute>} />
            <Route path="/courses/:id" element={<ApprovedRoute><CourseDetailPage /></ApprovedRoute>} />
            <Route path="/guides" element={<ApprovedRoute><GuidesPage /></ApprovedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
            <Route path="/admin/tasks" element={<AdminRoute><AdminTasksPage /></AdminRoute>} />
            <Route path="/admin/courses" element={<AdminRoute><AdminCoursesPage /></AdminRoute>} />
            <Route path="/admin/courses/:courseId/lessons" element={<AdminRoute><AdminLessonsPage /></AdminRoute>} />
            <Route path="/admin/guides" element={<AdminRoute><AdminGuidesPage /></AdminRoute>} />
            <Route path="/admin/verifications" element={<AdminRoute><AdminVerificationsPage /></AdminRoute>} />
            <Route path="/admin/transactions" element={<AdminRoute><AdminTransactionsPage /></AdminRoute>} />
            <Route path="/admin/broadcast" element={<AdminRoute><AdminBroadcastPage /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
