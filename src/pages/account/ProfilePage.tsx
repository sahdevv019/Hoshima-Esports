import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateSafeProfileFields } from '../../services/profileService';
import { Lock, Save, CheckCircle } from 'lucide-react';

const AVATAR_COLORS = [
  '#00e5ff', '#e040fb', '#ff4655', '#ffd600',
  '#4fc3f7', '#4ade80', '#ff9800', '#ce93d8', '#f87171', '#a3e635'
];

const GAMES = ['Free Fire Max', 'BGMI', 'Valorant', 'Mobile Legends'];

export const ProfilePage: React.FC = () => {
  const { currentUser, userProfile, role, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [gamingUsername, setGamingUsername] = useState(userProfile?.gamingUsername || '');
  const [preferredGame, setPreferredGame] = useState(userProfile?.preferredGame || 'Free Fire Max');
  const [inGameId, setInGameId] = useState(userProfile?.inGameId || '');
  const [preferredRole, setPreferredRole] = useState(userProfile?.preferredRole || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [color, setColor] = useState(userProfile?.color || '#00e5ff');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      await updateSafeProfileFields(currentUser.uid, {
        displayName,
        gamingUsername,
        preferredGame,
        inGameId,
        preferredRole,
        bio,
        color
      });
      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
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
      <div className="section-header">
        <p className="section-tag">Identity & Clearance</p>
        <h1 className="section-title">
          OPERATIVE <span>PROFILE</span>
        </h1>
        <div className="section-line" />
      </div>

      <div
        style={{
          background: 'var(--dark2)',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 24px 80px rgba(0,0,0,.6)'
        }}
      >
        {/* Protected Security Credentials Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '24px',
            marginBottom: '32px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Lock size={16} color="#ffd700" />
            <h3
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '0.8rem',
                color: '#ffd700',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight: 700
              }}
            >
              Protected Security Credentials (Immutable by User)
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px'
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: '#4a6a8a', textTransform: 'uppercase' }}>Assigned Role</span>
              <p style={{ marginTop: '4px' }}>
                <span className={`role-badge-${role}`}>{role?.toUpperCase()}</span>
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#4a6a8a', textTransform: 'uppercase' }}>Approval Status</span>
              <p
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: userProfile?.status === 'approved' ? '#4ade80' : '#facc15',
                  marginTop: '4px',
                  textTransform: 'uppercase'
                }}
              >
                {userProfile?.status || 'Pending'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#4a6a8a', textTransform: 'uppercase' }}>Google Account</span>
              <p style={{ fontFamily: 'Exo 2, sans-serif', fontSize: '0.85rem', color: '#8ca0b8', marginTop: '4px' }}>
                {currentUser?.email || 'N/A'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#4a6a8a', textTransform: 'uppercase' }}>Firebase UID</span>
              <p style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.7rem', color: '#4a6a8a', marginTop: '4px' }}>
                {currentUser?.uid}
              </p>
            </div>
          </div>
        </div>

        {/* Editable Profile Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div
              style={{
                background: 'rgba(255, 70, 85, 0.12)',
                border: '1px solid rgba(255, 70, 85, 0.3)',
                padding: '12px',
                borderRadius: '6px',
                color: '#ff6b7a',
                fontSize: '0.85rem'
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: 'rgba(74, 222, 128, 0.12)',
                border: '1px solid rgba(74, 222, 128, 0.3)',
                padding: '12px',
                borderRadius: '6px',
                color: '#4ade80',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle size={16} /> Profile changes committed to Cloud Firestore!
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label htmlFor="profile-display-name" style={{ display: 'block', fontSize: '0.75rem', color: '#4a6a8a', marginBottom: '6px', textTransform: 'uppercase' }}>
                Display Name (Max 50)
              </label>
              <input
                id="profile-display-name"
                type="text"
                required
                maxLength={50}
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
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
              <label htmlFor="profile-gaming-username" style={{ display: 'block', fontSize: '0.75rem', color: '#4a6a8a', marginBottom: '6px', textTransform: 'uppercase' }}>
                Gaming Tag / Username (Max 30)
              </label>
              <input
                id="profile-gaming-username"
                type="text"
                required
                maxLength={30}
                autoComplete="username"
                autoCorrect="off"
                autoCapitalize="off"
                value={gamingUsername}
                onChange={(e) => setGamingUsername(e.target.value)}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label htmlFor="profile-preferred-game" style={{ display: 'block', fontSize: '0.75rem', color: '#4a6a8a', marginBottom: '6px', textTransform: 'uppercase' }}>
                Primary Game
              </label>
              <select
                id="profile-preferred-game"
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
              <label htmlFor="profile-in-game-id" style={{ display: 'block', fontSize: '0.75rem', color: '#4a6a8a', marginBottom: '6px', textTransform: 'uppercase' }}>
                In-Game ID / UID (Max 40)
              </label>
              <input
                id="profile-in-game-id"
                type="text"
                maxLength={40}
                autoCorrect="off"
                autoCapitalize="off"
                value={inGameId}
                onChange={(e) => setInGameId(e.target.value)}
                placeholder="e.g. 5129381023"
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
            <label htmlFor="profile-preferred-role" style={{ display: 'block', fontSize: '0.75rem', color: '#4a6a8a', marginBottom: '6px', textTransform: 'uppercase' }}>
              Preferred Role / Position (Max 40)
            </label>
            <input
              id="profile-preferred-role"
              type="text"
              maxLength={40}
              value={preferredRole}
              onChange={(e) => setPreferredRole(e.target.value)}
              placeholder="e.g. Rusher, Sniper, Duelist"
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
            <label htmlFor="profile-bio" style={{ display: 'block', fontSize: '0.75rem', color: '#4a6a8a', marginBottom: '6px', textTransform: 'uppercase' }}>
              Operative Bio (Max 300)
            </label>
            <textarea
              id="profile-bio"
              rows={3}
              maxLength={300}
              aria-describedby="profile-bio-hint"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
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
            <span id="profile-bio-hint" style={{ fontSize: '0.72rem', color: '#4a6a8a', float: 'right', marginTop: '4px' }}>
              {bio.length} / 300
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#4a6a8a', marginBottom: '8px', textTransform: 'uppercase' }}>
              Avatar Accent Color
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {AVATAR_COLORS.map((c) => (
                <div
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    cursor: 'pointer',
                    border: color === c ? '3px solid #fff' : '2px solid transparent',
                    boxShadow: color === c ? '0 0 10px #fff' : 'none',
                    transform: color === c ? 'scale(1.15)' : 'none',
                    transition: 'all .2s'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
            <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '12px 30px' }}>
              <Save size={16} /> {saving ? 'Saving...' : 'Commit Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
