import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import UserDetail from "./pages/UserDetail";
import Notifications from "./pages/Notifications";
import "./index.css";

// 環境に応じたベースパスを取得
const getBasename = () => {
  // 本番環境では '/product/dist/'、開発環境では '/' を使用
  return import.meta.env.PROD ? '/product/dist' : '/';
};

function App() {
  const basename = getBasename();
  console.log('React Router basename:', basename);
  
  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/user/:userId" element={<UserDetail />} />
        <Route path="/notifications/:userId" element={<Notifications />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
