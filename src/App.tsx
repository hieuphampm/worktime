import 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/common/ProtectedRoute';
// Layouts
import AdminLayout from './components/layout/AdminLayout';
import EmployeeLayout from './components/layout/EmployeeLayout';
// Pages
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AttendanceManagement from './pages/admin/AttendanceManagement';
import AttendanceHistory from './pages/admin/AttendanceHistory';
import ExcelExport from './pages/admin/ExcelExport';
import AuditLog from './pages/admin/AuditLog';
import Settings from './pages/admin/Settings';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeHistoryPage from './pages/employee/EmployeeHistory';
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="attendance" element={<AttendanceManagement />} />
              <Route path="history" element={<AttendanceHistory />} />
              <Route path="export" element={<ExcelExport />} />
              <Route path="audit" element={<AuditLog />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            {/* Employee routes */}
            <Route
              path="/employee"
              element={
                <ProtectedRoute requiredRole="EMPLOYEE">
                  <EmployeeLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<EmployeeDashboard />} />
              <Route path="history" element={<EmployeeHistoryPage />} />
            </Route>
            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
