import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import UserDetail from "./pages/UserDetail";
import Notifications from "./pages/Notifications";
import LoginForm from "./components/auth/LoginForm";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import "./index.css";

// 認証が必要なコンポーネントをラップする
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">認証状態を確認中...</div>
      </div>
    );
  }
  
  if (!user) {
    return <LoginForm />;
  }
  
  return children;
};

function AppContent() {
  const { user } = useAuth();
  
  console.log('App component loaded, Environment:', import.meta.env.MODE);
  console.log('Current user:', user?.email);
  
  return (
    <Router>
      <Routes>
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/device" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        } />
        <Route path="/admin/user/:userId" element={
          <ProtectedRoute>
            <UserDetail />
          </ProtectedRoute>
        } />
        <Route path="/notifications/:userId" element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
