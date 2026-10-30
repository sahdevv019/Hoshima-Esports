import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles
}) => {
  const { currentUser, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          gap: '16px'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid rgba(0, 229, 255, 0.2)',
            borderTopColor: 'var(--cyan)',
            animation: 'spin 1s linear infinite'
          }}
        />
        <p style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--cyan)', letterSpacing: '0.15em' }}>
          VERIFYING TACTICAL CREDENTIALS...
        </p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not signed in: redirect to login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Pending user trying to access privileged pages: redirect to /pending
  if (role === 'pending' && allowedRoles && !allowedRoles.includes('pending')) {
    return <Navigate to="/pending" replace />;
  }

  // Role check: If specific roles are required and user role is not allowed
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          textAlign: 'center',
          padding: '20px'
        }}
      >
        <ShieldAlert size={64} color="#ff4655" style={{ marginBottom: '20px' }} />
        <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.8rem', color: '#fff', marginBottom: '12px' }}>
          RESTRICTED ACCESS AREA
        </h2>
        <p style={{ maxWidth: '480px', color: '#7a9ab5', lineHeight: 1.6, marginBottom: '24px' }}>
          Your current authorization level (<strong>{role.toUpperCase()}</strong>) does not have clearance to view this
          terminal.
        </p>
        <a href="/" className="btn-outline">
          Return to Hub
        </a>
      </div>
    );
  }

  return <>{children}</>;
};
