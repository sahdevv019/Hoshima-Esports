import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle } from 'lucide-react';
import { isFirebaseConfigured } from '../../lib/firebase';

export const LoginPage: React.FC = () => {
  const { currentUser, role, loginWithGoogle, loading, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // If already authenticated, redirect appropriately
  React.useEffect(() => {
    if (currentUser && !loading) {
      if (role === 'pending') {
        navigate('/pending', { replace: true });
      } else {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    }
  }, [currentUser, role, loading, navigate, location]);

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
      // Navigation is triggered by the useEffect above once auth & profile settle
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (!err.message?.includes('Redirecting')) {
        setLocalError(err.message || 'Google authentication failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div
      style={{
        paddingTop: '100px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 20px 40px'
      }}
    >
      <div
        style={{
          background: 'var(--dark2)',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          borderRadius: '16px',
          padding: '48px 40px',
          width: 'min(440px, 95vw)',
          boxShadow: '0 32px 80px rgba(0,0,0,.7), var(--glow)',
          textAlign: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
          <svg width="44" height="44" viewBox="0 0 100 100" fill="none">
            <path
              d="M38 40 C36 36 32 34 28 36 C22 38 20 46 24 52 C28 58 36 62 44 60 L50 58 L56 60 C64 62 72 58 76 52 C80 46 78 38 72 36 C68 34 64 36 62 40"
              stroke="#a8d8f0"
              strokeWidth="3"
              fill="none"
            />
            <ellipse cx="35" cy="44" rx="5" ry="6" fill="#a8d8f0" />
            <ellipse cx="65" cy="44" rx="5" ry="6" fill="#a8d8f0" />
            <ellipse cx="36" cy="43" rx="2.5" ry="3" fill="#0d47a1" />
            <ellipse cx="66" cy="43" rx="2.5" ry="3" fill="#0d47a1" />
            <path d="M40 32 C42 24 46 18 50 14 C54 18 58 24 60 32" stroke="#00e5ff" strokeWidth="2" fill="none" />
          </svg>
          <span className="nav-logo-text" style={{ fontSize: '1.4rem' }}>
            HOSHIMA
          </span>
        </div>

        <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.25rem', color: '#fff', marginBottom: '10px' }}>
          OPERATIVE ACCESS
        </h2>
        <p style={{ color: '#7a9ab5', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '28px' }}>
          Sign in via Google Identity to access member dashboards, squad scrims, and match strategy.
        </p>

        {!isFirebaseConfigured && (
          <div
            style={{
              background: 'rgba(250, 204, 21, 0.08)',
              border: '1px solid rgba(250, 204, 21, 0.3)',
              borderRadius: '8px',
              padding: '12px 14px',
              color: '#facc15',
              fontSize: '0.8rem',
              textAlign: 'left',
              marginBottom: '20px',
              lineHeight: 1.5
            }}
          >
            <strong>Note:</strong> Firebase credentials are currently set to local development placeholders. Configure
            <code>.env.local</code> with your new Firebase project credentials or run against the Firebase Emulator Suite.
          </div>
        )}

        {displayError && (
          <div
            style={{
              background: 'rgba(255, 70, 85, 0.12)',
              border: '1px solid rgba(255, 70, 85, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              color: '#ff6b7a',
              fontSize: '0.85rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'left'
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{displayError}</span>
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={submitting || loading}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: '6px',
            background: '#ffffff',
            color: '#1a1a1a',
            border: 'none',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            fontSize: '1rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 4px 14px rgba(0,0,0,.4)',
            transition: 'all 0.2s',
            opacity: submitting || loading ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f1f1';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.transform = 'none';
          }}
        >
          {/* Official Google 'G' Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {submitting ? 'Authenticating...' : 'Sign In with Google'}
        </button>

        <div style={{ marginTop: '32px', borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.82rem', color: '#4a6a8a', lineHeight: 1.6 }}>
            <strong>Security Notice:</strong> First-time sign-ins receive <em>Pending</em> operative status. Private squad
            intel and team comms remain locked until an administrator reviews and approves your registration.
          </p>
        </div>
      </div>
    </div>
  );
};
