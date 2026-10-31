import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getScrimById,
  subscribeToScrimRegistrations,
  registerForScrim,
  withdrawFromScrim,
  updateScrimStatus,
  recordScrimResult,
  getMatchesForScrim,
  formatScrimDateTime
} from '../../services/scrimService';
import type {
  Scrim,
  ScrimRegistration,
  CompetitiveMatch,
  PlayerMatchPerformance
} from '../../types/competitive';
import {
  Users,
  ArrowLeft,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Trophy,
  Lock,
  Flame
} from 'lucide-react';

const GAME_IDS: Record<string, string> = {
  'Free Fire Max': 'ff',
  'BGMI': 'bgmi',
  'Valorant': 'val',
  'Mobile Legends': 'ml'
};

export const ScrimDetailsPage: React.FC = () => {
  const { scrimId } = useParams<{ scrimId: string }>();
  const { currentUser, userProfile, role } = useAuth();

  const [scrim, setScrim] = useState<Scrim | null>(null);
  const [registrations, setRegistrations] = useState<ScrimRegistration[]>([]);
  const [matches, setMatches] = useState<CompetitiveMatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Join modal state
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [teamName, setTeamName] = useState(userProfile?.gamingUsername ? `${userProfile.gamingUsername} SQUAD` : '');
  const [contact, setContact] = useState('');
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Record Results modal state
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [teamAName, setTeamAName] = useState('');
  const [teamAScore, setTeamAScore] = useState<number>(0);
  const [teamBName, setTeamBName] = useState('');
  const [teamBScore, setTeamBScore] = useState<number>(0);
  const [winnerTeam, setWinnerTeam] = useState<'A' | 'B'>('A');
  const [mvpName, setMvpName] = useState('');
  const [mvpKills, setMvpKills] = useState<number>(0);
  const [submittingResult, setSubmittingResult] = useState(false);

  const isAdmin = role === 'admin';
  const isCaptain = role === 'captain';
  const isApprovedMember = role === 'member' || isCaptain || isAdmin;

  // Load scrim data and listen for live registrations
  useEffect(() => {
    if (!scrimId) return;

    setLoading(true);
    getScrimById(scrimId)
      .then((data) => {
        setScrim(data);
        if (data) {
          setTeamAName(data.squad || 'Hoshima Prime');
          setTeamBName('Opponent Squad');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch scrim:', err);
        setLoading(false);
      });

    const unsubRegs = subscribeToScrimRegistrations(scrimId, setRegistrations);
    getMatchesForScrim(scrimId).then(setMatches).catch(console.error);

    return () => unsubRegs();
  }, [scrimId]);

  if (loading) {
    return (
      <div style={{ paddingTop: '140px', textAlign: 'center', color: '#5a7a9a', minHeight: '80vh' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid rgba(0, 229, 255, 0.2)',
            borderTopColor: 'var(--cyan)',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}
        />
        <p style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          DECRYPTING SCRIM DOSSIER...
        </p>
      </div>
    );
  }

  if (!scrim) {
    return (
      <div style={{ paddingTop: '140px', textAlign: 'center', minHeight: '80vh', maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>
        <h2 style={{ fontFamily: 'Orbitron, monospace', color: '#fff', fontSize: '1.4rem', marginBottom: '12px' }}>
          Scrim Not Found
        </h2>
        <p style={{ color: '#7a9ab5', marginBottom: '24px' }}>
          The requested scrimmage session does not exist or has been cancelled.
        </p>
        <Link to="/scrims" className="btn-primary" style={{ padding: '8px 24px', textDecoration: 'none' }}>
          Back to Scrims Hub
        </Link>
      </div>
    );
  }

  const isUserRegistered = currentUser && registrations.some((r) => r.userId === currentUser.uid);
  const isOrganizer = currentUser && (isAdmin || (isCaptain && scrim.createdBy === currentUser.uid));
  const gameKey = GAME_IDS[scrim.game] || 'ff';
  const isRegistrationOpen = scrim.status === 'registration-open';
  const isFull = (scrim.currentParticipants || 0) >= scrim.maxParticipants;

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setActionError(null);
    setSubmittingJoin(true);

    try {
      await registerForScrim(scrim.id, {
        userId: currentUser.uid,
        userName: userProfile?.gamingUsername || userProfile?.displayName || 'Operative',
        teamName: teamName.trim() || 'Solo Operative',
        contact: contact.trim() || (userProfile?.gamingUsername ? `@${userProfile.gamingUsername}` : 'Operative Coordinator'),
        game: scrim.game
      });

      // Refresh scrim document state
      const updated = await getScrimById(scrim.id);
      if (updated) setScrim(updated);

      setActionSuccess('Successfully registered for scrimmage drill! Check #scrim-lobby for credentials.');
      setIsJoinOpen(false);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      console.error('[ScrimDetails] Join error:', err);
      setActionError(err.message || 'Failed to complete registration.');
    } finally {
      setSubmittingJoin(false);
    }
  };

  const handleWithdraw = async () => {
    if (!currentUser) return;
    if (!window.confirm('Are you sure you want to withdraw your team from this scrim slot?')) {
      return;
    }

    setActionError(null);
    try {
      await withdrawFromScrim(scrim.id, currentUser.uid);
      const updated = await getScrimById(scrim.id);
      if (updated) setScrim(updated);

      setActionSuccess('Registration successfully withdrawn.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error('[ScrimDetails] Withdraw error:', err);
      setActionError(err.message || 'Failed to withdraw from scrim.');
    }
  };

  const handleStatusChange = async (newStatus: any) => {
    try {
      await updateScrimStatus(scrim.id, newStatus);
      setScrim({ ...scrim, status: newStatus });
      setActionSuccess(`Scrim status updated to ${newStatus}.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update status.');
    }
  };

  const handleRecordResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmittingResult(true);
    setActionError(null);

    const winner = winnerTeam === 'A' ? teamAName : teamBName;
    const playerStats: PlayerMatchPerformance[] = [];
    if (mvpName.trim()) {
      playerStats.push({
        name: mvpName.trim(),
        team: winner,
        kills: Number(mvpKills) || 0,
        deaths: 0,
        assists: 0,
        isMVP: true
      });
    }

    try {
      await recordScrimResult(scrim.id, {
        game: scrim.game,
        teamA: { id: 'team_a', name: teamAName.trim(), score: Number(teamAScore) },
        teamB: { id: 'team_b', name: teamBName.trim(), score: Number(teamBScore) },
        winnerId: winnerTeam === 'A' ? 'team_a' : 'team_b',
        winnerName: winner,
        confirmedBy: currentUser.uid,
        playerStats,
        map: scrim.map
      });

      // Refresh scrim & match data
      const updatedScrim = await getScrimById(scrim.id);
      if (updatedScrim) setScrim(updatedScrim);
      const updatedMatches = await getMatchesForScrim(scrim.id);
      setMatches(updatedMatches);

      setIsRecordOpen(false);
      setActionSuccess('Match result officially recorded and confirmed for organizational stats.');
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      console.error('[ScrimDetails] Record result error:', err);
      setActionError(err.message || 'Failed to record official match results.');
    } finally {
      setSubmittingResult(false);
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
      {/* Back button */}
      <Link
        to="/scrims"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: '#7a9ab5',
          fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 600,
          fontSize: '0.88rem',
          textDecoration: 'none',
          marginBottom: '24px'
        }}
      >
        <ArrowLeft size={16} /> Back to Scrims Hub
      </Link>

      {/* Notifications */}
      {actionSuccess && (
        <div
          role="alert"
          style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid #22c55e',
            borderRadius: '8px',
            padding: '14px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#fff',
            fontSize: '0.9rem'
          }}
        >
          <CheckCircle2 size={20} color="#22c55e" style={{ flexShrink: 0 }} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '14px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#f87171',
            fontSize: '0.9rem'
          }}
        >
          <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Hero Card */}
      <div
        style={{
          background: 'var(--dark2)',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          borderRadius: '14px',
          padding: '36px',
          marginBottom: '32px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '100px',
                  fontSize: '0.75rem',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  backgroundColor: 'rgba(0, 229, 255, 0.1)',
                  border: '1px solid var(--cyan)',
                  color: 'var(--cyan)'
                }}
              >
                {scrim.game}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#ffd600', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                MAP: {scrim.map || 'Bermuda'}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#7a9ab5' }}>
                Hosted by: <strong style={{ color: '#fff' }}>{scrim.creatorName || 'Staff'}</strong>
              </span>
            </div>

            <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '2.2rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
              {scrim.title}
            </h1>

            <p style={{ color: '#7a9ab5', fontSize: '0.95rem', maxWidth: '750px', lineHeight: 1.5 }}>
              {scrim.description || 'Official Hoshima competitive training drill for regional tournament preparation.'}
            </p>
          </div>

          {/* Quick Registration or Management Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
            {isUserRegistered ? (
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(34,197,94,0.15)',
                    border: '1px solid #22c55e',
                    color: '#4ade80',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    marginBottom: '8px'
                  }}
                >
                  <CheckCircle2 size={16} /> YOU ARE REGISTERED
                </span>
                <div>
                  <button
                    onClick={handleWithdraw}
                    className="btn-outline"
                    style={{ color: '#f87171', borderColor: 'rgba(239,68,68,0.3)', padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    Withdraw Registration
                  </button>
                </div>
              </div>
            ) : isRegistrationOpen && !isFull ? (
              isApprovedMember ? (
                <button
                  onClick={() => setIsJoinOpen(true)}
                  className="btn-primary"
                  style={{ padding: '12px 28px', fontSize: '0.95rem' }}
                >
                  Join Scrim Slot
                </button>
              ) : (
                <div style={{ color: '#facc15', fontSize: '0.82rem', textAlign: 'right', maxWidth: '240px' }}>
                  <Lock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Member clearance required to enroll squad
                </div>
              )
            ) : (
              <span style={{ color: '#f87171', fontSize: '0.88rem', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>
                {isFull ? 'ROSTER CAPACITY FULL' : `REGISTRATION ${scrim.status.toUpperCase()}`}
              </span>
            )}

            {/* Organizer Controls */}
            {isOrganizer && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={() => setIsRecordOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #ffd700, #b8860b)',
                    border: 'none',
                    color: '#000',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}
                >
                  Record Match Results
                </button>

                <select
                  value={scrim.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  style={{
                    background: 'var(--dark3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    padding: '6px 10px',
                    color: '#8ca0b8',
                    fontSize: '0.78rem',
                    outline: 'none'
                  }}
                >
                  <option value="registration-open">Set: Open</option>
                  <option value="registration-closed">Set: Closed</option>
                  <option value="live">Set: Live</option>
                  <option value="completed">Set: Completed</option>
                  <option value="cancelled">Set: Cancelled</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Tactical Key Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: '#5a7a9a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Scheduled Match Time
            </span>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
              {formatScrimDateTime(scrim.scheduledTime)}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#5a7a9a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Registration Deadline
            </span>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: 'var(--silver)', marginTop: '4px' }}>
              {formatScrimDateTime(scrim.registrationDeadline)}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#5a7a9a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Format & Map
            </span>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: 'var(--cyan)', marginTop: '4px' }}>
              {scrim.format} • {scrim.map || 'Bermuda'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#5a7a9a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Roster Capacity
            </span>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: '#ffd600', marginTop: '4px' }}>
              {scrim.currentParticipants || 0} / {scrim.maxParticipants} Registered
            </div>
          </div>
        </div>
      </div>

      {/* Comms Channel Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(21,101,192,0.08))',
          border: '1px solid rgba(0, 229, 255, 0.25)',
          borderRadius: '10px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '36px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0,229,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cyan)'
            }}
          >
            <MessageSquare size={22} />
          </div>
          <div>
            <h4 style={{ fontFamily: 'Orbitron, monospace', color: '#fff', fontSize: '0.98rem', marginBottom: '2px' }}>
              Tactical Match Coordination Frequency: #{scrim.game.toLowerCase().includes('free') ? 'scrim-lobby' : 'scrim-lobby'}
            </h4>
            <p style={{ color: '#7a9ab5', fontSize: '0.85rem' }}>
              Custom room ID, match credentials, and check-ins are broadcast in the squad communications hub.
            </p>
          </div>
        </div>

        <Link
          to={`/game/${gameKey}`}
          className="btn-primary"
          style={{ padding: '8px 20px', fontSize: '0.85rem', textDecoration: 'none' }}
        >
          Open #scrim-lobby Comms →
        </Link>
      </div>

      {/* Confirmed Match Results (if any exist) */}
      {matches.length > 0 && (
        <div
          style={{
            background: 'var(--dark2)',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: '12px',
            padding: '28px',
            marginBottom: '36px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Trophy size={22} color="#ffd700" />
            <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.2rem', color: '#fff' }}>
              Official Match Results
            </h3>
            <span
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                backgroundColor: 'rgba(255,215,0,0.1)',
                border: '1px solid #ffd700',
                color: '#ffd700',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700
              }}
            >
              CONFIRMED
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {matches.map((m) => (
              <div
                key={m.id}
                style={{
                  background: 'var(--dark3)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  padding: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.2rem', fontWeight: 800, color: m.winnerName === m.teamA.name ? '#ffd700' : '#fff' }}>
                        {m.teamA.name}
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--cyan)' }}>
                        {m.teamA.score || 0}
                      </div>
                    </div>

                    <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '1rem', color: '#5a7a9a' }}>VS</span>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.2rem', fontWeight: 800, color: m.winnerName === m.teamB.name ? '#ffd700' : '#fff' }}>
                        {m.teamB.name}
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f87171' }}>
                        {m.teamB.score || 0}
                      </div>
                    </div>
                  </div>

                  {m.winnerName && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: '#5a7a9a', textTransform: 'uppercase' }}>Winner</span>
                      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: '#ffd700' }}>
                        🏆 {m.winnerName}
                      </div>
                    </div>
                  )}
                </div>

                {/* Player MVP Callout */}
                {m.playerStats && m.playerStats.length > 0 && (
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {m.playerStats.map((ps, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#7a9ab5' }}>
                        <Flame size={14} color="#ff4655" />
                        <span>MVP: <strong style={{ color: '#fff' }}>{ps.name}</strong> ({ps.kills} Frags)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registered Squads Roster Table */}
      <div
        style={{
          background: 'var(--dark2)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '28px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.2rem', color: '#fff' }}>
              Enrolled Squad Lineups
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#7a9ab5' }}>
              Verified participant squads registered for this session
            </span>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--cyan)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>
            {registrations.length} of {scrim.maxParticipants} Slots Taken
          </span>
        </div>

        {registrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: '#5a7a9a' }}>
            <Users size={32} color="#4a6a8a" style={{ margin: '0 auto 10px' }} />
            <p style={{ fontSize: '0.9rem' }}>No squads enrolled yet. Be the first to claim a slot!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {registrations.map((reg, index) => (
              <div
                key={reg.id}
                style={{
                  background: 'var(--dark3)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,229,255,0.1)',
                    border: '1px solid var(--cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: 'var(--cyan)'
                  }}
                >
                  #{index + 1}
                </div>
                <div>
                  <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.92rem', color: '#fff', fontWeight: 600 }}>
                    {reg.teamName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#7a9ab5' }}>
                    Leader: {reg.userName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Join Scrim Modal */}
      {isJoinOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontFamily: 'Orbitron, monospace', color: '#fff', fontSize: '1.2rem', marginBottom: '8px' }}>
              Enroll in {scrim.title}
            </h3>
            <p style={{ color: '#7a9ab5', fontSize: '0.85rem', marginBottom: '20px' }}>
              Confirm your roster slot. Room credentials will unlock in #scrim-lobby prior to start time.
            </p>

            <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Squad / Team Callsign *
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Hoshima Red Wolves"
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
                  Leader Tactical Coordinate (Discord Handle / IGN)
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. Discord: @axiom_ops"
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

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsJoinOpen(false)}
                  className="btn-outline"
                  style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingJoin}
                  className="btn-primary"
                  style={{ padding: '8px 22px', fontSize: '0.85rem', opacity: submittingJoin ? 0.7 : 1 }}
                >
                  {submittingJoin ? 'Registering...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Results Modal */}
      {isRecordOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <h3 style={{ fontFamily: 'Orbitron, monospace', color: '#fff', fontSize: '1.25rem', marginBottom: '8px' }}>
              Record Match Outcome
            </h3>
            <p style={{ color: '#7a9ab5', fontSize: '0.85rem', marginBottom: '20px' }}>
              Confirm official scrim results. This data feeds directly into organization and player leaderboards.
            </p>

            <form onSubmit={handleRecordResultSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Team A Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={teamAName}
                    onChange={(e) => setTeamAName(e.target.value)}
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
                    Team A Score / Points *
                  </label>
                  <input
                    type="number"
                    required
                    value={teamAScore}
                    onChange={(e) => setTeamAScore(Number(e.target.value))}
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
                    Team B Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={teamBName}
                    onChange={(e) => setTeamBName(e.target.value)}
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
                    Team B Score / Points *
                  </label>
                  <input
                    type="number"
                    required
                    value={teamBScore}
                    onChange={(e) => setTeamBScore(Number(e.target.value))}
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
                  Match Winner *
                </label>
                <select
                  value={winnerTeam}
                  onChange={(e) => setWinnerTeam(e.target.value as 'A' | 'B')}
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
                  <option value="A">Team A ({teamAName || 'Team A'}) Wins</option>
                  <option value="B">Team B ({teamBName || 'Team B'}) Wins</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Match MVP / Top Fragger
                  </label>
                  <input
                    type="text"
                    value={mvpName}
                    onChange={(e) => setMvpName(e.target.value)}
                    placeholder="e.g. VIPER"
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
                    MVP Kills / Frags
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={mvpKills}
                    onChange={(e) => setMvpKills(Number(e.target.value))}
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

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsRecordOpen(false)}
                  className="btn-outline"
                  style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResult}
                  className="btn-primary"
                  style={{ padding: '8px 24px', fontSize: '0.85rem', opacity: submittingResult ? 0.7 : 1 }}
                >
                  {submittingResult ? 'Saving Outcome...' : 'Confirm Official Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
