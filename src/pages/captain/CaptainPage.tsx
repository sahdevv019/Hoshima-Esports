import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToRoster, addRosterPlayer, deleteRosterPlayer } from '../../services/rosterService';
import type { RosterPlayer } from '../../types/roster';
import { AlertCircle, Plus, Trash2, CheckCircle, X, ShieldAlert } from 'lucide-react';
import { GAMES_DATA } from '../../data/defaultGames';

export const CaptainPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [players, setPlayers] = useState<RosterPlayer[]>([]);
  const assignedSquad = userProfile?.assignedSquad || userProfile?.preferredGame || 'Free Fire Max';

  // Add operative state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [playerRole, setPlayerRole] = useState('');
  const [uid, setUid] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Status feedback toast / alert
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const unsub = subscribeToRoster(setPlayers);
    return () => unsub();
  }, []);

  const squadPlayers = players.filter((p) => p.game === assignedSquad);
  const gameDef = Object.values(GAMES_DATA).find((g) => g.name === assignedSquad) || GAMES_DATA.ff;

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      await addRosterPlayer({
        name: name.trim().toUpperCase(),
        tag: tag.trim() || 'Operative',
        role: playerRole.trim() || 'Starter',
        game: assignedSquad,
        uid: uid.trim() || 'N/A',
        color: '#a855f7'
      });

      setFeedback({
        type: 'success',
        message: `Operative "${name.trim().toUpperCase()}" successfully added to ${assignedSquad} lineup.`
      });
      setIsAddOpen(false);
      setName('');
      setTag('');
      setPlayerRole('');
      setUid('');
    } catch (err: any) {
      console.error('[CaptainHub] Failed to add roster operative:', err);
      if (err?.code === 'permission-denied') {
        setFeedback({
          type: 'error',
          message: `Firestore Security Denied: You are only authorized to manage operatives for your assigned squad (${assignedSquad}).`
        });
      } else {
        setFeedback({
          type: 'error',
          message: err?.message || 'Failed to add operative to lineup.'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlayer = async (player: RosterPlayer) => {
    if (player.game !== assignedSquad) {
      setFeedback({
        type: 'error',
        message: `Security Scope Violation: You cannot remove operatives from other squads (${player.game}).`
      });
      return;
    }

    if (!window.confirm(`Confirm removal of "${player.name}" from the active ${assignedSquad} lineup?`)) {
      return;
    }

    setFeedback(null);
    try {
      await deleteRosterPlayer(player.id);
      setFeedback({
        type: 'success',
        message: `Operative "${player.name}" removed from ${assignedSquad} lineup.`
      });
    } catch (err: any) {
      console.error('[CaptainHub] Failed to delete roster operative:', err);
      if (err?.code === 'permission-denied') {
        setFeedback({
          type: 'error',
          message: `Firestore Security Denied: Only the assigned Captain or an Administrator can modify this lineup.`
        });
      } else {
        setFeedback({
          type: 'error',
          message: err?.message || 'Failed to remove operative from lineup.'
        });
      }
    }
  };

  return (
    <div
      style={{
        paddingTop: '100px',
        minHeight: '100vh',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '100px 20px 80px'
      }}
    >
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span className="role-badge-captain">SQUAD CAPTAIN CLEARANCE</span>
          <span style={{ fontSize: '0.85rem', color: '#c084fc', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
            {assignedSquad.toUpperCase()} DIVISION
          </span>
        </div>
        <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '2.2rem', fontWeight: 900, color: '#fff' }}>
          CAPTAIN OPERATIONS HUB
        </h1>
        <p style={{ color: '#7a9ab5' }}>Manage roster lineups, scrimmage drills, and match tactical deployments.</p>
      </div>

      {/* Security Scope Notice */}
      <div
        style={{
          background: 'rgba(168, 85, 247, 0.08)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          borderRadius: '8px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          color: '#e9d5ff'
        }}
      >
        <AlertCircle size={20} color="#c084fc" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
          <strong>Squad Scoped Access:</strong> Captain permissions are strictly authorized for your assigned squad (
          <em>{assignedSquad}</em>). Captains cannot promote users to Administrator, demote leaders, or alter lineups of other divisions.
        </span>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          role="alert"
          style={{
            background: feedback.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${feedback.type === 'success' ? '#22c55e' : '#ef4444'}`,
            borderRadius: '6px',
            padding: '12px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#fff',
            fontSize: '0.9rem'
          }}
        >
          {feedback.type === 'success' ? (
            <CheckCircle size={20} color="#22c55e" style={{ flexShrink: 0 }} />
          ) : (
            <ShieldAlert size={20} color="#ef4444" style={{ flexShrink: 0 }} />
          )}
          <span style={{ flex: 1 }}>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', color: '#8ca0b8', cursor: 'pointer', padding: '4px' }}
            aria-label="Dismiss feedback"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Squad Lineup & Match Schedule Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {/* Lineup Card */}
        <div
          style={{
            background: 'var(--dark2)',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: '12px',
            padding: '28px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.1rem', color: '#fff' }}>
                Active {assignedSquad} Lineup
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#c084fc' }}>{squadPlayers.length} Active Operatives</span>
            </div>
            <button
              onClick={() => {
                setFeedback(null);
                setIsAddOpen(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                border: 'none',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 12px rgba(168,85,247,0.3)'
              }}
            >
              <Plus size={15} /> Add Operative
            </button>
          </div>

          {squadPlayers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: '#5a7a9a' }}>
              <p style={{ fontSize: '0.88rem', marginBottom: '12px' }}>No operatives currently assigned to this lineup.</p>
              <button
                onClick={() => setIsAddOpen(true)}
                style={{
                  background: 'none',
                  border: '1px solid #c084fc',
                  color: '#c084fc',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Enroll First Operative
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {squadPlayers.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: 'var(--dark3)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: `${p.color || '#a855f7'}22`,
                        color: p.color || '#a855f7',
                        border: `1px solid ${p.color || '#a855f7'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'Orbitron, monospace',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}
                    >
                      {p.name.substring(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.9rem', color: '#fff' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#7a9ab5' }}>
                        {p.role} • <span style={{ color: '#5a7a9a' }}>UID: {p.uid || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'Rajdhani, sans-serif', color: '#c084fc', fontSize: '0.8rem', fontWeight: 600 }}>
                      {p.tag}
                    </span>
                    <button
                      onClick={() => handleDeletePlayer(p)}
                      style={{
                        background: 'rgba(255,70,85,0.1)',
                        border: '1px solid rgba(255,70,85,0.25)',
                        color: '#ff4655',
                        padding: '6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={`Remove ${p.name} from ${assignedSquad}`}
                      aria-label={`Remove ${p.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Division Scrim Sessions */}
        <div
          style={{
            background: 'var(--dark2)',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: '12px',
            padding: '28px'
          }}
        >
          <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.1rem', color: '#fff', marginBottom: '20px' }}>
            Division Scrim Sessions
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {gameDef.scrims.map((s, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px 16px',
                  backgroundColor: 'var(--dark3)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#5a7a9a' }}>
                    {s.time} • {s.format}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: s.status === 'open' ? '#4ade80' : s.status === 'full' ? '#ff4655' : '#facc15'
                  }}
                >
                  ● {s.status}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '20px',
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: '#7a9ab5',
              lineHeight: 1.5
            }}
          >
            Tactical scrim registrations and team check-ins are organized in the squad comms channel (
            <strong style={{ color: '#c084fc' }}>#scrim-lobby</strong>).
          </div>
        </div>
      </div>

      {/* Add Squad Operative Modal */}
      {isAddOpen && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontFamily: 'Orbitron, monospace', color: '#fff', fontSize: '1.2rem' }}>
                  Enroll Squad Operative
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#c084fc', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                  DIVISION: {assignedSquad.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                style={{ background: 'none', border: 'none', color: '#8ca0b8', cursor: 'pointer' }}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPlayer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px' }}>
                  OPERATIVE CALLSIGN / NAME *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. CYCLONE"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px' }}>
                  TAG / SPECIALTY
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="e.g. Fragger / Recon"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px' }}>
                  ROLE IN SQUAD
                </label>
                <input
                  type="text"
                  value={playerRole}
                  onChange={(e) => setPlayerRole(e.target.value)}
                  placeholder="e.g. Starter / Substitute / IGL"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px' }}>
                  ASSIGNED SQUAD (FIXED TO YOUR CAPTAINCY SCOPE)
                </label>
                <input
                  type="text"
                  readOnly
                  value={assignedSquad}
                  style={{
                    width: '100%',
                    background: 'rgba(168,85,247,0.08)',
                    border: '1px solid rgba(168,85,247,0.3)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    color: '#c084fc',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'not-allowed'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px' }}>
                  GAME IN-GAME UID
                </label>
                <input
                  type="text"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="e.g. FFM-98421"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="btn-outline"
                  style={{ padding: '8px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 22px',
                    borderRadius: '6px',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Enrolling...' : 'Save Operative'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
