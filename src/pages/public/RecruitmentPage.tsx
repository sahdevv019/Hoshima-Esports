import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  submitRegistrationApplication,
  getApplicationByUid
} from '../../services/applicationService';
import { ShieldCheck, CheckCircle2, Clock, Send, AlertCircle } from 'lucide-react';

const GAMES = ['Free Fire Max', 'BGMI', 'Valorant', 'Mobile Legends'];

export const RecruitmentPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [gamingUsername, setGamingUsername] = useState('');
  const [preferredGame, setPreferredGame] = useState('Free Fire Max');
  const [inGameId, setInGameId] = useState('');
  const [preferredRole, setPreferredRole] = useState('');
  const [bio, setBio] = useState('');

  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(userProfile?.displayName || currentUser.displayName || '');
      setGamingUsername(userProfile?.gamingUsername || '');
      setPreferredGame(userProfile?.preferredGame || 'Free Fire Max');
      setInGameId(userProfile?.inGameId || '');
      setPreferredRole(userProfile?.preferredRole || '');
      setBio(userProfile?.bio || '');

      // Load existing application if any
      getApplicationByUid(currentUser.uid).then((app) => {
        if (app) {
          setExistingStatus(app.status);
          setDisplayName(app.displayName || '');
          setGamingUsername(app.gamingUsername || '');
          setPreferredGame(app.preferredGame || 'Free Fire Max');
          setInGameId(app.inGameId || '');
          setPreferredRole(app.preferredRole || '');
          setBio(app.bio || '');
        }
      });
    }
  }, [currentUser, userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setMessage(null);
    setLoading(true);

    try {
      await submitRegistrationApplication(currentUser.uid, currentUser.email, {
        displayName,
        gamingUsername,
        preferredGame,
        inGameId,
        preferredRole,
        bio
      });

      setExistingStatus('pending');
      setMessage({
        type: 'success',
        text: 'Your application has been successfully submitted and is under review by Hoshima Administrators.'
      });

      // Navigate to pending dashboard after short delay
      setTimeout(() => {
        navigate('/pending');
      }, 1500);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Submission failed. Please check your fields and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', maxWidth: '860px', margin: '0 auto', padding: '100px 20px 80px' }}>
      <div className="section-header">
        <p className="section-tag">Trial Out</p>
        <h1 className="section-title">
          JOIN <span>HOSHIMA</span>
        </h1>
        <div className="section-line" />
        <p style={{ color: '#5a7a9a', marginTop: '14px', fontSize: '1rem' }}>
          Apply to represent Hoshima Esports across our official squads
        </p>
      </div>

      {/* Recruitment Process Steps */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '40px'
        }}
      >
        <div style={{ background: 'var(--dark3)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ color: 'var(--cyan)', fontFamily: 'Orbitron, monospace', fontWeight: 900, marginBottom: '6px' }}>01</div>
          <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '4px' }}>Google Auth</h4>
          <p style={{ fontSize: '0.8rem', color: '#5a7a9a' }}>Secure your operative identity.</p>
        </div>
        <div style={{ background: 'var(--dark3)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ color: 'var(--cyan)', fontFamily: 'Orbitron, monospace', fontWeight: 900, marginBottom: '6px' }}>02</div>
          <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '4px' }}>Submit Dossier</h4>
          <p style={{ fontSize: '0.8rem', color: '#5a7a9a' }}>Game UID, role, and intro.</p>
        </div>
        <div style={{ background: 'var(--dark3)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ color: 'var(--cyan)', fontFamily: 'Orbitron, monospace', fontWeight: 900, marginBottom: '6px' }}>03</div>
          <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '4px' }}>Admin Review</h4>
          <p style={{ fontSize: '0.8rem', color: '#5a7a9a' }}>Scouting verification.</p>
        </div>
        <div style={{ background: 'var(--dark3)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ color: 'var(--cyan)', fontFamily: 'Orbitron, monospace', fontWeight: 900, marginBottom: '6px' }}>04</div>
          <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '4px' }}>Squad Activation</h4>
          <p style={{ fontSize: '0.8rem', color: '#5a7a9a' }}>Full Hub & Scrim clearance.</p>
        </div>
      </div>

      {!currentUser ? (
        <div
          style={{
            background: 'var(--dark2)',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            borderRadius: '12px',
            padding: '48px 32px',
            textAlign: 'center'
          }}
        >
          <ShieldCheck size={48} color="var(--cyan)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.4rem', color: '#fff', marginBottom: '12px' }}>
            AUTHENTICATION REQUIRED
          </h2>
          <p style={{ color: '#7a9ab5', maxWidth: '440px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            You must sign in with Google to establish your operative UID before submitting a squad application.
          </p>
          <Link to="/login" className="btn-primary">
            Sign In with Google to Apply
          </Link>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--dark2)',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            borderRadius: '12px',
            padding: '36px',
            boxShadow: '0 20px 60px rgba(0,0,0,.6)'
          }}
        >
          {existingStatus && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 18px',
                borderRadius: '8px',
                marginBottom: '24px',
                background:
                  existingStatus === 'approved'
                    ? 'rgba(74,222,128,.1)'
                    : existingStatus === 'rejected'
                    ? 'rgba(255,70,85,.1)'
                    : 'rgba(250,204,21,.1)',
                border:
                  existingStatus === 'approved'
                    ? '1px solid rgba(74,222,128,.3)'
                    : existingStatus === 'rejected'
                    ? '1px solid rgba(255,70,85,.3)'
                    : '1px solid rgba(250,204,21,.3)',
                color:
                  existingStatus === 'approved'
                    ? '#4ade80'
                    : existingStatus === 'rejected'
                    ? '#ff4655'
                    : '#facc15'
              }}
            >
              {existingStatus === 'approved' ? (
                <CheckCircle2 size={20} />
              ) : existingStatus === 'rejected' ? (
                <AlertCircle size={20} />
              ) : (
                <Clock size={20} />
              )}
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Application Status: {existingStatus}
              </span>
            </div>
          )}

          {message && (
            <div
              style={{
                padding: '12px 18px',
                borderRadius: '8px',
                marginBottom: '24px',
                background: message.type === 'success' ? 'rgba(74,222,128,.1)' : 'rgba(255,70,85,.1)',
                border: message.type === 'success' ? '1px solid rgba(74,222,128,.3)' : '1px solid rgba(255,70,85,.3)',
                color: message.type === 'success' ? '#4ade80' : '#ff4655',
                fontSize: '0.9rem'
              }}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '0.75rem',
                    color: '#4a6a8a',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}
                >
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. John Doe"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: '6px',
                    padding: '11px 14px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '0.75rem',
                    color: '#4a6a8a',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}
                >
                  Gaming Username (IGN) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={30}
                  value={gamingUsername}
                  onChange={(e) => setGamingUsername(e.target.value)}
                  placeholder="e.g. PHANTOM_X"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: '6px',
                    padding: '11px 14px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '0.75rem',
                    color: '#4a6a8a',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}
                >
                  Primary Competitive Game *
                </label>
                <select
                  value={preferredGame}
                  onChange={(e) => setPreferredGame(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--dark)',
                    border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: '6px',
                    padding: '11px 14px',
                    color: '#fff',
                    outline: 'none'
                  }}
                >
                  {GAMES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '0.75rem',
                    color: '#4a6a8a',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}
                >
                  In-Game ID / UID *
                </label>
                <input
                  type="text"
                  required
                  maxLength={40}
                  value={inGameId}
                  onChange={(e) => setInGameId(e.target.value)}
                  placeholder="e.g. 5129381023 or Riot Tag"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: '6px',
                    padding: '11px 14px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '0.75rem',
                  color: '#4a6a8a',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}
              >
                Preferred In-Game Role *
              </label>
              <input
                type="text"
                required
                maxLength={40}
                value={preferredRole}
                onChange={(e) => setPreferredRole(e.target.value)}
                placeholder="e.g. IGL, Rusher, Sniper, Duelist, Controller, Jungler"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: '6px',
                  padding: '11px 14px',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '0.75rem',
                  color: '#4a6a8a',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}
              >
                Introduction & Experience * (10 to 300 characters)
              </label>
              <textarea
                required
                rows={3}
                minLength={10}
                maxLength={300}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Briefly state your competitive achievements, past teams, and availability."
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: '6px',
                  padding: '11px 14px',
                  color: '#fff',
                  outline: 'none',
                  resize: 'none'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: '#4a6a8a', float: 'right', marginTop: '4px' }}>
                {bio.length} / 300
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || existingStatus === 'approved'}
              className="btn-primary"
              style={{
                marginTop: '10px',
                width: '100%',
                opacity: loading || existingStatus === 'approved' ? 0.6 : 1
              }}
            >
              <Send size={18} /> {loading ? 'Transmitting Application...' : 'Submit Application for Admin Review'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
