import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import LoginPage from "@/pages/auth/LoginPage";
import ActivationPage from "@/pages/auth/ActivationPage";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import NotFound from "@/pages/NotFound";
import SettingsPage from "@/pages/SettingsPage";

import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentAttendance from "@/pages/student/StudentAttendance";
import StudentAccess from "@/pages/student/StudentAccess";
import StudentAlerts from "@/pages/student/StudentAlerts";
import StudentAccount from "@/pages/student/StudentAccount";
import StudentSupport from "@/pages/student/StudentSupport";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminStudents from "@/pages/admin/AdminStudents";
import AdminAttendance from "@/pages/admin/AdminAttendance";
import AdminAccess from "@/pages/admin/AdminAccess";
import AdminIncidents from "@/pages/admin/AdminIncidents";
import AdminPresence from "@/pages/admin/AdminPresence";
import AdminAlerts from "@/pages/admin/AdminAlerts";
import AdminActivity from "@/pages/admin/AdminActivity";

const queryClient = new QueryClient();

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return null;
  const isAdmin = user.role === "admin" || user.role === "security";
  return isAdmin ? <AdminDashboard /> : <StudentDashboard />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/activate" element={<ActivationPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardRouter />} />
              <Route path="/attendance" element={<ProtectedRoute allowedRoles={["student"]}><StudentAttendance /></ProtectedRoute>} />
              <Route path="/access" element={<ProtectedRoute allowedRoles={["student"]}><StudentAccess /></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute allowedRoles={["student"]}><StudentAlerts /></ProtectedRoute>} />
              <Route path="/account" element={<ProtectedRoute allowedRoles={["student"]}><StudentAccount /></ProtectedRoute>} />
              <Route path="/support" element={<ProtectedRoute allowedRoles={["student"]}><StudentSupport /></ProtectedRoute>} />

              <Route path="/admin/students" element={<ProtectedRoute allowedRoles={["admin", "security"]}><AdminStudents /></ProtectedRoute>} />
              <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={["admin", "security"]}><AdminAttendance /></ProtectedRoute>} />
              <Route path="/admin/access" element={<ProtectedRoute allowedRoles={["admin", "security"]}><AdminAccess /></ProtectedRoute>} />
              <Route path="/admin/incidents" element={<ProtectedRoute allowedRoles={["admin", "security"]}><AdminIncidents /></ProtectedRoute>} />
              <Route path="/admin/presence" element={<ProtectedRoute allowedRoles={["admin", "security"]}><AdminPresence /></ProtectedRoute>} />
              <Route path="/admin/alerts" element={<ProtectedRoute allowedRoles={["admin", "security"]}><AdminAlerts /></ProtectedRoute>} />
              <Route path="/admin/activity" element={<ProtectedRoute allowedRoles={["admin", "security"]}><AdminActivity /></ProtectedRoute>} />

              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
