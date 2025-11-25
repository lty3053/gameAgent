import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import UploadPage from './pages/UploadPage';
import GamesPage from './pages/GamesPage';
import GameDetailPage from './pages/GameDetailPage';
import AdminGamesPage from './pages/AdminGamesPage';
import { CyberToastContainer } from './components/CyberToast';
import { isAuthenticated } from './utils/auth';

// 受保护的路由组件
function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Router>
      <CyberToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/upload" 
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/games" 
          element={
            <ProtectedRoute>
              <GamesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/games/:id" 
          element={
            <ProtectedRoute>
              <GameDetailPage />
            </ProtectedRoute>
          } 
        />
        {/* 管理员页面 - 仅 localhost 可访问 */}
        <Route 
          path="/admin/games" 
          element={
            <ProtectedRoute>
              <AdminGamesPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
