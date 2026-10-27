import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import ReportIssuePage from './pages/student/ReportIssuePage';
import IssuesListPage from './pages/issues/IssuesListPage';
import IssueDetailPage from './pages/issues/IssueDetailPage';
import StaffDashboard from './pages/staff/StaffDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import DepartmentManagementPage from './pages/admin/DepartmentManagementPage';
import NotificationsPage from './pages/notifications/NotificationsPage';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'staff') return <Navigate to="/staff" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Application Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<RootRedirect />} />

                {/* Student specific */}
                <Route
                  element={<ProtectedRoute allowedRoles={['student', 'admin']} />}
                >
                  <Route path="/dashboard" element={<StudentDashboard />} />
                  <Route path="/report" element={<ReportIssuePage />} />
                </Route>

                {/* Staff specific */}
                <Route
                  element={<ProtectedRoute allowedRoles={['staff', 'admin']} />}
                >
                  <Route path="/staff" element={<StaffDashboard />} />
                </Route>

                {/* Admin specific */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<UserManagementPage />} />
                  <Route
                    path="/admin/departments"
                    element={<DepartmentManagementPage />}
                  />
                </Route>

                {/* Shared routes for all authenticated users */}
                <Route path="/issues" element={<IssuesListPage />} />
                <Route path="/issues/:id" element={<IssueDetailPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
