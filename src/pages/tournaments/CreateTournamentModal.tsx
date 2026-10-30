import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createTournament } from '../../services/tournamentService';
import { COMPETITIVE_GAMES, type CompetitiveGame, type TournamentFormat } from '../../types/competitive';
import { X, ShieldAlert } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (tournamentId: string) => void;
}

export const CreateTournamentModal: React.FC<CreateTournamentModalProps> = ({
  isOpen,
  onClose,
  onCreated
}) => {
  const { currentUser, userProfile } = useAuth();

  const [name, setName] = useState('');
  const [game, setGame] = useState<CompetitiveGame>('Free Fire Max');
  const [format, setFormat] = useState<TournamentFormat>('single-elimination');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('14:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('21:00');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('12:00');
  const [maxTeams, setMaxTeams] = useState<number>(8);
  const [prizePool, setPrizePool] = useState('₹50,000 Championship Cup & Medals');
  const [rules, setRules] = useState('Official tournament rulebook. Fair play, anti-cheat, verified rosters.');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError(null);

    if (!startDate || !startTime || !endDate || !endTime || !deadlineDate || !deadlineTime) {
      setError('Please provide all schedule timestamps (start, end, and deadline).');
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    const endDateTime = new Date(`${endDate}T${endTime}:00`);
    const deadlineDateTime = new Date(`${deadlineDate}T${deadlineTime}:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime()) || isNaN(deadlineDateTime.getTime())) {
      setError('Invalid date or time provided.');
      return;
    }

    if (deadlineDateTime >= startDateTime) {
      setError('Registration deadline must be earlier than the tournament start time.');
      return;
    }

    if (startDateTime >= endDateTime) {
      setError('Tournament end time must be after the tournament start time.');
      return;
    }

    setLoading(true);
    try {
      const tournamentId = await createTournament({
        name: name.trim(),
        game,
        description: description.trim() || 'Official Hoshima competitive championship series.',
        startDate: Timestamp.fromDate(startDateTime),
        endDate: Timestamp.fromDate(endDateTime),
        registrationDeadline: Timestamp.fromDate(deadlineDateTime),
        maxTeams: Number(maxTeams),
        format,
        rules: rules.trim(),
        prizePool: prizePool.trim(),
        status: 'registration-open',
        createdBy: currentUser.uid,
        creatorName: userProfile?.gamingUsername || userProfile?.displayName || 'Administrator'
      });

      onCreated(tournamentId);
      onClose();
    } catch (err: any) {
      console.error('[CreateTournamentModal] Error:', err);
      setError(err.message || 'Failed to initialize tournament.');
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
              CREATE TOURNAMENT
            </h3>
            <p style={{ color: '#7a9ab5', fontSize: '0.8rem', marginTop: '2px' }}>
              Official administrative championship and bracket management
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
              Tournament Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hoshima South Asia Invitational Cup"
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
                Game Division *
              </label>
              <select
                value={game}
                onChange={(e) => setGame(e.target.value as CompetitiveGame)}
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
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
                Bracket Format *
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as TournamentFormat)}
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
                <option value="single-elimination">Single Elimination (Knockout Bracket)</option>
                <option value="round-robin">Round Robin (Group Stage Standings)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
                Max Team Capacity *
              </label>
              <select
                value={maxTeams}
                onChange={(e) => setMaxTeams(Number(e.target.value))}
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
                <option value={4}>4 Teams</option>
                <option value={8}>8 Teams (Quarter-Finals)</option>
                <option value={16}>16 Teams (Round of 16)</option>
                <option value={32}>32 Teams</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
                Prize Description *
              </label>
              <input
                type="text"
                required
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
                placeholder="e.g. ₹50,000 Trophy & Certificates"
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

          {/* Schedule */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (!endDate) setEndDate(e.target.value);
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
                Start Time *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
                End Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
                End Time *
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
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
              Description & Format Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tournament format rules, seed distribution, stream details..."
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

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
              Official Rulebook & Anti-Cheat Code
            </label>
            <textarea
              rows={2}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Fair play guidelines, device restrictions, roster check-in rules..."
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
              {loading ? 'Creating...' : 'Initialize Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
