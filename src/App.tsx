import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import AuthPage from "./pages/AuthPage";
import JournalPage from "./pages/JournalPage";
import InsightsPage from "./pages/InsightsPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={!user ? <AuthPage /> : <Navigate to="/journal" replace />}
      />
      <Route
        path="/journal"
        element={user ? <JournalPage /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/insights"
        element={user ? <InsightsPage /> : <Navigate to="/auth" replace />}
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="*"
        element={<Navigate to={user ? "/journal" : "/auth"} replace />}
      />
    </Routes>
  );
}
