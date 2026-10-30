import React, { useState, useEffect } from 'react';
import { subscribeToRoster, addRosterPlayer, deleteRosterPlayer } from '../../services/rosterService';
import type { RosterPlayer } from '../../types/roster';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2 } from 'lucide-react';

const GAMES = ['All', 'Free Fire Max', 'BGMI', 'Valorant', 'Mobile Legends'];

export const TeamsPage: React.FC = () => {
  const { role } = useAuth();
  const [players, setPlayers] = useState<RosterPlayer[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>('All');

  // Add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [playerRole, setPlayerRole] = useState('');
  const [game, setGame] = useState('Free Fire Max');
  const [uid, setUid] = useState('');
  const [color] = useState('#00e5ff');

  const isAdminOrCaptain = role === 'admin' || role === 'captain';

  useEffect(() => {
    const unsub = subscribeToRoster(setPlayers);
    return () => unsub();
  }, []);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await addRosterPlayer({
        name: name.trim().toUpperCase(),
        tag: tag.trim() || 'Player',
        role: playerRole.trim() || 'Starter',
        game,
        uid: uid.trim() || 'N/A',
        color
      });
      setIsAddOpen(false);
      setName('');
      setTag('');
      setPlayerRole('');
      setUid('');
    } catch (err) {
      console.error('Failed to add player:', err);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (window.confirm('Remove this player from the official roster?')) {
      try {
        await deleteRosterPlayer(id);
      } catch (err) {
        console.error('Failed to delete player:', err);
      }
    }
  };

  const filtered = selectedGame === 'All' ? players : players.filter((p) => p.game === selectedGame);

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', maxWidth: '1200px', margin: '0 auto', padding: '100px 20px 60px' }}>
      <div className="section-header">
        <p className="section-tag">Organization Roster</p>
        <h1 className="section-title">
          THE <span>TEAMS</span>
        </h1>
        <div className="section-line" />
        <p style={{ color: '#5a7a9a', marginTop: '14px', fontSize: '1rem' }}>
          Official competing rosters for all Hoshima Esports divisions
        </p>
      </div>

      {/* Filter and Admin Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '36px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {GAMES.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGame(g)}
              style={{
                background: selectedGame === g ? 'linear-gradient(135deg,#1565c0,#0288d1)' : 'rgba(255,255,255,.05)',
                color: selectedGame === g ? '#fff' : '#8ca0b8',
                border: '1px solid',
                borderColor: selectedGame === g ? 'var(--cyan)' : 'rgba(255,255,255,.1)',
                padding: '8px 16px',
                borderRadius: '6px',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all .2s'
              }}
            >
              {g}
            </button>
          ))}
        </div>

        {isAdminOrCaptain && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: '0.85rem' }}
          >
            <Plus size={16} /> Add Roster Player
          </button>
        )}
      </div>

      {/* Roster Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '24px'
        }}
      >
        {filtered.map((p) => (
          <div
            key={p.id}
            style={{
              backgroundColor: 'var(--dark3)',
              border: '1px solid rgba(255,255,255,.07)',
              borderRadius: '8px',
              padding: '24px 20px',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            {isAdminOrCaptain && (
              <button
                onClick={() => handleDeletePlayer(p.id)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(255,70,85,.1)',
                  border: '1px solid rgba(255,70,85,.3)',
                  color: '#ff4655',
                  padding: '4px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                title="Remove Player"
              >
                <Trash2 size={14} />
              </button>
            )}

            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                margin: '0 auto 14px',
                border: `2px solid ${p.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Orbitron, monospace',
                fontSize: '1.4rem',
                fontWeight: 900,
                backgroundColor: 'var(--dark2)',
                color: p.color
              }}
            >
              {p.name.substring(0, 2)}
            </div>
            <p
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#4a6a8a',
                marginBottom: '4px'
              }}
            >
              {p.tag}
            </p>
            <h3
              style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '4px'
              }}
            >
              {p.name}
            </h3>
            <p
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '0.85rem',
                color: 'var(--cyan)',
                fontWeight: 600,
                marginBottom: '10px'
              }}
            >
              {p.role}
            </p>
            {p.uid && (
              <p
                style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '0.68rem',
                  color: '#3a5a7a',
                  marginBottom: '12px'
                }}
              >
                UID: {p.uid}
              </p>
            )}
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '100px',
                fontSize: '0.72rem',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                backgroundColor: 'rgba(0, 229, 255, 0.08)',
                border: '1px solid rgba(0, 229, 255, 0.2)',
                color: 'var(--cyan)'
              }}
            >
              {p.game}
            </span>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'Orbitron, monospace', color: '#fff', fontSize: '1.2rem', marginBottom: '20px' }}>
              Add Roster Player
            </h3>
            <form onSubmit={handleAddPlayer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#4a6a8a', marginBottom: '6px' }}>
                  PLAYER NAME *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AXIOM"
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
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#4a6a8a', marginBottom: '6px' }}>
                  TAG / SPECIALTY
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="e.g. Leader / AWPer"
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
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#4a6a8a', marginBottom: '6px' }}>
                  ROLE IN TEAM
                </label>
                <input
                  type="text"
                  value={playerRole}
                  onChange={(e) => setPlayerRole(e.target.value)}
                  placeholder="e.g. Captain / Entry Fragger"
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
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#4a6a8a', marginBottom: '6px' }}>
                  GAME
                </label>
                <select
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--dark2)',
                    border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    color: '#fff',
                    outline: 'none'
                  }}
                >
                  <option value="Free Fire Max">Free Fire Max</option>
                  <option value="BGMI">BGMI</option>
                  <option value="Valorant">Valorant</option>
                  <option value="Mobile Legends">Mobile Legends</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#4a6a8a', marginBottom: '6px' }}>
                  GAME UID
                </label>
                <input
                  type="text"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="e.g. FFM-10294"
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
                <button type="submit" className="btn-primary" style={{ padding: '8px 22px' }}>
                  Save Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
