import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subscribeToApplication } from '../../services/applicationService';
import type { RegistrationApplication } from '../../types/auth';
import { Clock, LogOut, Edit3, AlertCircle, FileText, XCircle } from 'lucide-react';

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

  const isRejected = application?.status === 'rejected';
  const isPendingReview = application?.status === 'pending';
  const hasNoApplication = !loadingApp && !application;

  return (
    <div
      style={{
        paddingTop: '100px',
        minHeight: '100vh',
        maxWidth: '820px',
        margin: '0 auto',
        padding: '100px 20px 80px'
      }}
    >
      <div
        style={{
          background: 'var(--dark2)',
          border: `1px solid ${isRejected ? 'rgba(255, 70, 85, 0.4)' : hasNoApplication ? 'rgba(0, 229, 255, 0.35)' : 'rgba(250, 204, 21, 0.3)'}`,
          borderRadius: '16px',
          padding: '40px',
          boxShadow: `0 24px 80px rgba(0,0,0,.7), 0 0 30px ${isRejected ? 'rgba(255, 70, 85, 0.12)' : hasNoApplication ? 'rgba(0, 229, 255, 0.1)' : 'rgba(250, 204, 21, 0.1)'}`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Status Badge Header */}
        <div style={{ marginBottom: '24px' }}>
          {hasNoApplication ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0, 229, 255, 0.12)',
                border: '1px solid rgba(0, 229, 255, 0.35)',
                borderRadius: '100px',
                padding: '6px 16px',
                color: 'var(--cyan)',
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase'
              }}
            >
              <FileText size={16} /> Action Required: Submit Recruitment Dossier
            </div>
          ) : isRejected ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 70, 85, 0.12)',
                border: '1px solid rgba(255, 70, 85, 0.35)',
                borderRadius: '100px',
                padding: '6px 16px',
                color: '#ff6b7a',
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase'
              }}
            >
              <XCircle size={16} /> Application Declined
            </div>
          ) : (
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
                textTransform: 'uppercase'
              }}
            >
              <Clock size={16} /> Awaiting Administrator Authorization
            </div>
          )}
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

        <p style={{ color: '#7a9ab5', fontSize: '1rem', lineHeight: 1.6, marginBottom: '28px' }}>
          {hasNoApplication
            ? 'Your Google account is signed in with a Pending profile, but you have not yet completed a recruitment application. To trial out for Hoshima rosters and access squad terminals, submit your competitive dossier below.'
            : isRejected
            ? 'Your competitive recruitment application has been reviewed and declined by Hoshima organization leadership. Your account remains restricted from private squad resources.'
            : 'Your Google identity is verified. Hoshima Esports maintains strict competitive standards; all applications are individually reviewed by team scouting and administrators.'}
        </p>

        {/* If No Application Submitted: Clear Call-To-Action Banner */}
        {hasNoApplication && (
          <div
            style={{
              background: 'rgba(0, 229, 255, 0.05)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              borderRadius: '12px',
              padding: '28px',
              marginBottom: '32px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(0, 229, 255, 0.1)',
                color: 'var(--cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <FileText size={24} />
            </div>
            <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.2rem', color: '#fff', marginBottom: '8px' }}>
              RECRUITMENT APPLICATION REQUIRED
            </h3>
            <p style={{ color: '#8ca0b8', fontSize: '0.92rem', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Select your game division (Free Fire Max, BGMI, Valorant, or Mobile Legends), provide your in-game UID, and describe your competitive experience.
            </p>
            <Link
              to="/recruitment"
              className="btn-primary"
              style={{ padding: '12px 28px', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              Complete Recruitment Application Now →
            </Link>
          </div>
        )}

        {/* If Rejected: Rejection Reason & Appeal Information */}
        {isRejected && (
          <div
            style={{
              background: 'rgba(255, 70, 85, 0.08)',
              border: '1px solid rgba(255, 70, 85, 0.3)',
              borderRadius: '10px',
              padding: '24px',
              marginBottom: '32px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <AlertCircle size={20} color="#ff6b7a" />
              <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1rem', color: '#fff' }}>
                APPLICATION STATUS: DECLINED
              </h3>
            </div>
            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', padding: '14px', borderRadius: '6px', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: '#8ca0b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Reviewer Decision Notes
              </span>
              <p style={{ color: '#ff8a98', fontSize: '0.95rem', marginTop: '4px', fontWeight: 600 }}>
                "{application.rejectionReason || 'Application does not meet current competitive criteria.'}"
              </p>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#8ca0b8', lineHeight: 1.6 }}>
              <strong>How to proceed:</strong> In accordance with organization security policies, self-serve client resubmission is locked after review. If you have achieved higher tier rankings or tournament placements and would like an administrator to re-evaluate your record, please contact Hoshima management via our official community Discord.
            </p>
          </div>
        )}

        {/* If Application Exists: Application Dossier Details */}
        {application && (
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
                Submitted Dossier Details
              </h3>
              {isPendingReview && (
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
                  <Edit3 size={14} /> Update Pending Details
                </Link>
              )}
            </div>

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
          </div>
        )}

        {/* Live Listener Pulse (shown when pending review) */}
        {isPendingReview && (
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
                boxShadow: '0 0 10px var(--cyan)',
                animation: 'pulse 2s infinite'
              }}
            />
            <span style={{ fontSize: '0.85rem', color: '#8ca0b8' }}>
              Live channel active. You do not need to refresh; this terminal will automatically open when approved.
            </span>
            <style>{`@keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }`}</style>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
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
