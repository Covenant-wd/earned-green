import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";

import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import OAuthConsentPage from "@/pages/OAuthConsentPage";
import NotFound from "@/pages/NotFound";

import DashboardPage from "@/pages/DashboardPage";
import CoursesPage from "@/pages/CoursesPage";
import CourseDetailPage from "@/pages/CourseDetailPage";
import LessonPage from "@/pages/LessonPage";
import SchedulePage from "@/pages/SchedulePage";
import ClassroomPage from "@/pages/ClassroomPage";
import AssignmentsPage from "@/pages/AssignmentsPage";
import BillingPage from "@/pages/BillingPage";
import ProfilePage from "@/pages/ProfilePage";
import NotificationsPage from "@/pages/NotificationsPage";

import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import TeacherCourseDetail from "@/pages/teacher/TeacherCourseDetail";
import TeacherGradingPage from "@/pages/teacher/TeacherGradingPage";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminCoursesPage from "@/pages/admin/AdminCoursesPage";
import AdminCourseEditorPage from "@/pages/admin/AdminCourseEditorPage";
import AdminSessionsPage from "@/pages/admin/AdminSessionsPage";
import AdminAnnouncementsPage from "@/pages/admin/AdminAnnouncementsPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-pulse rounded-full bg-primary" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function TeacherRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isTeacher, isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isTeacher && !isAdmin) return <Navigate to="/dashboard" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/oauth/consent" element={<OAuthConsentPage />} />

      {/* Student */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
      <Route path="/courses/:slug" element={<ProtectedRoute><CourseDetailPage /></ProtectedRoute>} />
      <Route path="/courses/:slug/lessons/:lessonId" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
      <Route path="/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
      <Route path="/classroom/:sessionId" element={<ProtectedRoute><ClassroomPage /></ProtectedRoute>} />
      <Route path="/assignments" element={<ProtectedRoute><AssignmentsPage /></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* Teacher */}
      <Route path="/teach" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
      <Route path="/teach/courses/:id" element={<TeacherRoute><TeacherCourseDetail /></TeacherRoute>} />
      <Route path="/teach/assignments/:assignmentId/submissions" element={<TeacherRoute><TeacherGradingPage /></TeacherRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
      <Route path="/admin/courses" element={<AdminRoute><AdminCoursesPage /></AdminRoute>} />
      <Route path="/admin/courses/:id" element={<AdminRoute><AdminCourseEditorPage /></AdminRoute>} />
      <Route path="/admin/sessions" element={<AdminRoute><AdminSessionsPage /></AdminRoute>} />
      <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncementsPage /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
