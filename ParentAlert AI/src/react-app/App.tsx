import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import DashboardPage from "@/react-app/pages/Dashboard";
import StudentsPage from "@/react-app/pages/Students";
import AlertsPage from "@/react-app/pages/Alerts";
import CallLogsPage from "@/react-app/pages/CallLogs";
import AnalysisPage from "@/react-app/pages/Analysis";
import LoginPage from "@/react-app/pages/Login";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/call-logs" element={<CallLogsPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
