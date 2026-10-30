import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createScrim } from '../../services/scrimService';
import { COMPETITIVE_GAMES, type CompetitiveGame } from '../../types/competitive';
import { X, ShieldAlert } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface CreateScrimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (scrimId: string) => void;
}

const DEFAULT_MAPS: Record<CompetitiveGame, string[]> = {
  'Free Fire Max': ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'NexTerra'],
  'BGMI': ['Erangel', 'Miramar', 'Sanhok', 'Vikendi'],
  'Valorant': ['Ascent', 'Bind', 'Haven', 'Split', 'Sunset', 'Abyss'],
  'Mobile Legends': ['Sanctum Island', 'Imperial Sanctuary', 'Western Expanse']
};

export const CreateScrimModal: React.FC<CreateScrimModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { currentUser, userProfile, role } = useAuth();

  const isAdmin = role === 'admin';
  const isCaptain = role === 'captain';
  const assignedSquad = (userProfile?.assignedSquad || userProfile?.preferredGame || 'Free Fire Max') as CompetitiveGame;

  const [title, setTitle] = useState('');
  const [game, setGame] = useState<CompetitiveGame>(isCaptain ? assignedSquad : 'Free Fire Max');
  const [map, setMap] = useState(DEFAULT_MAPS[isCaptain ? assignedSquad : 'Free Fire Max'][0]);
  const [format, setFormat] = useState('Battle Royale (Squad)');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('18:00');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('17:00');
  const [maxParticipants, setMaxParticipants] = useState(12);
  const [rules, setRules] = useState('Standard competitive tournament rules. Minimum level 40, no emulators.');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGameChange = (newGame: CompetitiveGame) => {
    setGame(newGame);
    setMap(DEFAULT_MAPS[newGame][0] || 'Default Map');
    if (newGame === 'Valorant' || newGame === 'Mobile Legends') {
      setFormat('5v5 Competitive Match');
      setMaxParticipants(2);
    } else {
      setFormat('Battle Royale (Squad)');
      setMaxParticipants(12);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError(null);

    // Assemble timestamps
    if (!date || !time) {
      setError('Please provide a scheduled date and time.');
      return;
    }

    const scheduledDateTime = new Date(`${date}T${time}:00`);
    if (isNaN(scheduledDateTime.getTime())) {
      setError('Invalid scheduled match time.');
      return;
    }

    let deadlineDateTime: Date;
    if (deadlineDate && deadlineTime) {
      deadlineDateTime = new Date(`${deadlineDate}T${deadlineTime}:00`);
    } else {
      // Default deadline to 1 hour before scheduled time
      deadlineDateTime = new Date(scheduledDateTime.getTime() - 60 * 60 * 1000);
    }

    if (deadlineDateTime >= scheduledDateTime) {
      setError('Registration deadline must be earlier than the scheduled match time.');
      return;
    }

    setLoading(true);
    try {
      const scrimId = await createScrim({
        title: title.trim(),
        game,
        squad: game,
        map,
        format,
        scheduledTime: Timestamp.fromDate(scheduledDateTime),
        registrationDeadline: Timestamp.fromDate(deadlineDateTime),
        maxParticipants: Number(maxParticipants),
        rules: rules.trim(),
        description: description.trim(),
        status: 'registration-open',
        createdBy: currentUser.uid,
        creatorName: userProfile?.gamingUsername || userProfile?.displayName || 'Organizer',
        creatorRole: isAdmin ? 'admin' : 'captain'
      });

      onCreated(scrimId);
      onClose();
    } catch (err: any) {
      console.error('[CreateScrimModal] Error creating scrim:', err);
      if (err?.code === 'permission-denied') {
        setError('Firestore Security Violation: You only have permission to host scrims for your assigned division.');
      } else {
        setError(err.message || 'Failed to initialize competitive scrim.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontFamily: 'Orbitron, monospace', color: '#fff', fontSize: '1.25rem' }}>
              HOST COMPETITIVE SCRIM
            </h3>
            <p style={{ color: '#7a9ab5', fontSize: '0.8rem', marginTop: '2px' }}>
              Schedule tactical scrimmage drill and open registrations for squad operatives
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#8ca0b8', cursor: 'pointer', padding: '4px' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              padding: '12px 14px',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <ShieldAlert size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
              Scrim Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tier-1 Tactical Scrim #14"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
                Game Division {isCaptain && <span style={{ color: '#c084fc' }}>(Captain Scope)</span>}
              </label>
              {isCaptain ? (
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
              ) : (
                <select
                  value={game}
                  onChange={(e) => handleGameChange(e.target.value as CompetitiveGame)}
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
                  {COMPETITIVE_GAMES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
                Tactical Map *
              </label>
              <select
                value={map}
                onChange={(e) => setMap(e.target.value)}
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
                {DEFAULT_MAPS[game]?.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
                Match Format *
              </label>
              <input
                type="text"
                required
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                placeholder="e.g. Battle Royale (Squad) or 5v5 S&D"
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
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
                Max Participant Teams / Slots *
              </label>
              <input
                type="number"
                required
                min={2}
                max={50}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
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
          </div>

          {/* Timing Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
                Match Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (!deadlineDate) setDeadlineDate(e.target.value);
                }}
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
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
                Match Time (Local) *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
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
          </div>

          {/* Registration Deadline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
                Registration Deadline Date *
              </label>
              <input
                type="date"
                required
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
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
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
                Registration Deadline Time *
              </label>
              <input
                type="time"
                required
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
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
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
              Briefing / Tactical Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Operational details, room password instructions, etc."
              style={{
                width: '100%',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: '6px',
                padding: '10px 14px',
                color: '#fff',
                outline: 'none',
                resize: 'none',
                marginBottom: '12px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
              Rules & Guidelines
            </label>
            <textarea
              rows={2}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: '6px',
                padding: '10px 14px',
                color: '#fff',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ padding: '8px 24px', fontSize: '0.85rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Scheduling...' : 'Launch Scrim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
