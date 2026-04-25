import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import ClientsPage from './pages/ClientsPage';

// ══════════════════════════════════════════════
//  🔧 MODO MANTENIMIENTO
//  Cambia a false cuando quieras volver a estar online
// ══════════════════════════════════════════════
const MAINTENANCE_MODE = false;

const MaintenancePage = () => (
  <div style={{
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#fff',
    textAlign: 'center',
    padding: '2rem',
  }}>
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '24px',
      padding: '3rem 4rem',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      maxWidth: '500px',
      width: '100%',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔧</div>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: '800',
        background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '0.75rem',
      }}>
        En Mantenimiento
      </h1>
      <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '2rem' }}>
        Estamos trabajando para mejorar la plataforma.<br />
        Volvemos muy pronto. 🚀
      </p>
      <div style={{
        display: 'inline-block',
        padding: '0.5rem 1.5rem',
        borderRadius: '999px',
        background: 'rgba(167, 139, 250, 0.15)',
        border: '1px solid rgba(167, 139, 250, 0.3)',
        color: '#a78bfa',
        fontSize: '0.85rem',
        fontWeight: '600',
        letterSpacing: '0.05em',
      }}>
        AUTO AI
      </div>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center font-sans">Cargando...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  if (MAINTENANCE_MODE) {
    return <MaintenancePage />;
  }

  return (
    <AuthProvider>
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid #333',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
      <Router>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/clients" element={
            <ProtectedRoute>
              <ClientsPage />
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/register" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

