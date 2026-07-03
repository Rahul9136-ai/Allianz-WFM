import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CreateRequestPage from "./pages/CreateRequestPage";
import RequestsListPage from "./pages/RequestsListPage";
import RequestDetailPage from "./pages/RequestDetailPage";
import NotificationsPage from "./pages/NotificationsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/requests/new" element={<CreateRequestPage />} />
          <Route path="/requests/mine" element={<RequestsListPage mine />} />
          <Route path="/requests/:id" element={<RequestDetailPage />} />
          <Route element={<ProtectedRoute allow={["WFM", "ADMIN"]} />}>
            <Route path="/requests" element={<RequestsListPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
          </Route>
          <Route element={<ProtectedRoute allow={["ADMIN"]} />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
