import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subscribeToApplication } from '../../services/applicationService';
import type { RegistrationApplication } from '../../types/auth';
import { Clock, LogOut, Edit3 } from 'lucide-react';

export const PendingPage: React.FC = () => {
  const { currentUser, userProfile, role, logout } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState<RegistrationApplication | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);

  // If role is promoted to member/captain/admin, auto-redirect to dashboard!
  useEffect(() => {
    if (role && role !== 'pending') {
      console.log('[Hoshima Pending] Clearance detected! Redirecting to Member Dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [role, navigate]);

  useEffect(() => {
    if (currentUser) {
      const unsub = subscribeToApplication(currentUser.uid, (app) => {
        setApplication(app);
        setLoadingApp(false);
      });
      return () => unsub();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div
      style={{
        paddingTop: '100px',
        minHeight: '100vh',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '100px 20px 80px'
      }}
    >
      <div
        style={{
          background: 'var(--dark2)',
          border: '1px solid rgba(250, 204, 21, 0.3)',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 24px 80px rgba(0,0,0,.7), 0 0 30px rgba(250, 204, 21, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(250, 204, 21, 0.12)',
            border: '1px solid rgba(250, 204, 21, 0.35)',
            borderRadius: '100px',
            padding: '6px 16px',
            color: '#facc15',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '24px'
          }}
        >
          <Clock size={16} /> Awaiting Administrator Authorization
        </div>

        <h1
          style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
            fontWeight: 900,
            color: '#fff',
            marginBottom: '12px'
          }}
        >
          Welcome, {userProfile?.displayName || currentUser?.displayName || 'Operative'}
        </h1>
        <p style={{ color: '#7a9ab5', fontSize: '1rem', lineHeight: 1.6, marginBottom: '32px' }}>
          Your Google account has been authenticated. However, because Hoshima Esports maintains strict competitive
          standards, all accounts require manual review and verification by an organization administrator before squad
          access is granted.
        </p>

        {/* Status Box */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '24px',
            marginBottom: '32px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '0.85rem',
                color: '#4a6a8a',
                letterSpacing: '0.2em',
                textTransform: 'uppercase'
              }}
            >
              Application Dossier
            </h3>
            <Link
              to="/recruitment"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--cyan)',
                fontSize: '0.85rem',
                textDecoration: 'none',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600
              }}
            >
              <Edit3 size={14} /> Update Application
            </Link>
          </div>

          {loadingApp ? (
            <p style={{ color: '#4a6a8a', fontSize: '0.9rem' }}>Retrieving application details...</p>
          ) : application ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#4a6a8a', textTransform: 'uppercase' }}>Gaming Name</span>
                <p style={{ fontFamily: 'Orbitron, monospace', fontSize: '1rem', color: '#fff', marginTop: '4px' }}>
                  {application.gamingUsername}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#4a6a8a', textTransform: 'uppercase' }}>Game Division</span>
                <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1rem', color: 'var(--cyan)', fontWeight: 600, marginTop: '4px' }}>
                  {application.preferredGame}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#4a6a8a', textTransform: 'uppercase' }}>In-Game ID</span>
                <p style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.9rem', color: '#8ca0b8', marginTop: '4px' }}>
                  {application.inGameId || 'N/A'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#4a6a8a', textTransform: 'uppercase' }}>Preferred Role</span>
                <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1rem', color: '#e0e8f0', marginTop: '4px' }}>
                  {application.preferredRole || 'Player'}
                </p>
              </div>
              <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#4a6a8a', textTransform: 'uppercase' }}>Experience Summary</span>
                <p style={{ fontSize: '0.9rem', color: '#8ca0b8', lineHeight: 1.5, marginTop: '4px' }}>
                  {application.bio || 'No introduction provided.'}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ color: '#8ca0b8', marginBottom: '14px', fontSize: '0.95rem' }}>
                You have not yet submitted your recruitment dossier.
              </p>
              <Link to="/recruitment" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                Complete Recruitment Dossier
              </Link>
            </div>
          )}
        </div>

        {/* Live Listener Pulse */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 20px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 229, 255, 0.04)',
            border: '1px solid rgba(0, 229, 255, 0.15)',
            marginBottom: '32px'
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: 'var(--cyan)',
              boxShadow: '0 0 10px var(--cyan)'
            }}
          />
          <span style={{ fontSize: '0.85rem', color: '#8ca0b8' }}>
            Live channel active. You do not need to refresh; this terminal will automatically open when approved.
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: '1px solid rgba(255, 70, 85, 0.3)',
              color: '#ff6b7a',
              borderRadius: '6px',
              padding: '10px 20px',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              fontSize: '0.9rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>

          <Link to="/" style={{ color: '#5a7a9a', textDecoration: 'none', fontSize: '0.88rem' }}>
            Browse Public Hub →
          </Link>
        </div>
      </div>
    </div>
  );
};
