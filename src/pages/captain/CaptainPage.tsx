import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToRoster } from '../../services/rosterService';
import type { RosterPlayer } from '../../types/roster';
import { AlertCircle } from 'lucide-react';
import { GAMES_DATA } from '../../data/defaultGames';

export const CaptainPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [players, setPlayers] = useState<RosterPlayer[]>([]);
  const assignedSquad = userProfile?.assignedSquad || userProfile?.preferredGame || 'Free Fire Max';

  useEffect(() => {
    const unsub = subscribeToRoster(setPlayers);
    return () => unsub();
  }, []);

  const squadPlayers = players.filter((p) => p.game === assignedSquad);
  const gameDef = Object.values(GAMES_DATA).find((g) => g.name === assignedSquad) || GAMES_DATA.ff;

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
          marginBottom: '36px',
          color: '#e9d5ff'
        }}
      >
        <AlertCircle size={20} color="#c084fc" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
          <strong>Squad Scoped Access:</strong> Captain permissions are strictly authorized for your assigned squad (
          <em>{assignedSquad}</em>). Captains cannot promote users to Administrator or modify organization security rules.
        </span>
      </div>

      {/* Squad Lineup & Match Schedule Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div
          style={{
            background: 'var(--dark2)',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: '12px',
            padding: '28px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.1rem', color: '#fff' }}>
              Active {assignedSquad} Lineup
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--cyan)' }}>{squadPlayers.length} Operatives</span>
          </div>

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
                      backgroundColor: `${p.color}22`,
                      color: p.color,
                      border: `1px solid ${p.color}`,
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
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.9rem', color: '#fff' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#4a6a8a' }}>{p.role}</div>
                  </div>
                </div>
                <span style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--cyan)', fontSize: '0.8rem', fontWeight: 600 }}>
                  {p.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

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
        </div>
      </div>
    </div>
  );
};
