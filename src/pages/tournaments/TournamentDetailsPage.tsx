import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getTournamentById,
  subscribeToTournamentById,
  subscribeToTournamentRegistrations,
  subscribeToTournamentMatches,
  registerTeamForTournament,
  withdrawTeamFromTournament,
  generateSingleEliminationBracket,
  generateRoundRobinSchedule,
  submitProposedMatchResult,
  confirmTournamentMatchResult,
  formatTournamentDateTime
} from '../../services/tournamentService';
import type {
  Tournament,
  TournamentRegistration,
  CompetitiveMatch,
  TournamentTeamMember
} from '../../types/competitive';
import {
  Trophy,
  Users,
  ArrowLeft,
  Layers,
  AlertCircle,
  CheckCircle2,
  Play
} from 'lucide-react';

export const TournamentDetailsPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { currentUser, userProfile, role } = useAuth();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [matches, setMatches] = useState<CompetitiveMatch[]>([]);
  const [activeTab, setActiveTab] = useState<'bracket' | 'teams' | 'rules'>('bracket');
  const [loading, setLoading] = useState(true);

  // Register Team Modal
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [contact, setContact] = useState('');
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [player3Name, setPlayer3Name] = useState('');
  const [player4Name, setPlayer4Name] = useState('');
  const [submittingReg, setSubmittingReg] = useState(false);

  // Result Modal
  const [selectedMatch, setSelectedMatch] = useState<CompetitiveMatch | null>(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [winnerTeam, setWinnerTeam] = useState<'A' | 'B'>('A');
  const [submittingMatch, setSubmittingMatch] = useState(false);

  // Feedback alerts
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isAdmin = role === 'admin';
  const isCaptain = role === 'captain';

  useEffect(() => {
    if (!tournamentId) return;

    setLoading(true);
    const unsubTourn = subscribeToTournamentById(tournamentId, (data) => {
      setTournament(data);
      setLoading(false);
    });

    const unsubRegs = subscribeToTournamentRegistrations(tournamentId, setRegistrations);
    const unsubMatches = subscribeToTournamentMatches(tournamentId, setMatches);

    return () => {
      unsubTourn();
      unsubRegs();
      unsubMatches();
    };
  }, [tournamentId]);

  if (loading) {
    return (
      <div style={{ paddingTop: '140px', textAlign: 'center', color: '#5a7a9a', minHeight: '80vh' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid rgba(255, 215, 0, 0.2)',
            borderTopColor: '#ffd700',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}
        />
        <p style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          LOADING TOURNAMENT ROSTERS & BRACKETS...
        </p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div style={{ paddingTop: '140px', textAlign: 'center', minHeight: '80vh', maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>
        <h2 style={{ fontFamily: 'Orbitron, monospace', color: '#fff', fontSize: '1.4rem', marginBottom: '12px' }}>
          Tournament Not Found
        </h2>
        <Link to="/tournaments" className="btn-primary" style={{ padding: '8px 24px', textDecoration: 'none' }}>
          Back to Tournaments
        </Link>
      </div>
    );
  }

  const isCaptainRegistered = currentUser && registrations.some((r) => r.captainUid === currentUser.uid);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmittingReg(true);
    setActionError(null);

    const rosterMembers: TournamentTeamMember[] = [
      { name: player1Name.trim() || userProfile?.gamingUsername || 'Player 1', role: 'Captain / IGL' },
      { name: player2Name.trim() || 'Player 2', role: 'Assault' },
      { name: player3Name.trim() || 'Player 3', role: 'Fragger' },
      { name: player4Name.trim() || 'Player 4', role: 'Support' }
    ];

    try {
      await registerTeamForTournament(tournament.id, {
        game: tournament.game,
        captainUid: currentUser.uid,
        captainName: userProfile?.gamingUsername || userProfile?.displayName || 'Captain',
        teamName: teamName.trim() || `${userProfile?.gamingUsername || 'Hoshima'} SQUAD`,
        contact: contact.trim() || (userProfile?.gamingUsername ? `@${userProfile.gamingUsername}` : 'Captain Coordinator'),
        roster: rosterMembers
      });

      const updated = await getTournamentById(tournament.id);
      if (updated) setTournament(updated);

      setIsRegisterOpen(false);
      setActionSuccess('Squad roster successfully enrolled in tournament!');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error('[TournamentDetails] Registration error:', err);
      setActionError(err.message || 'Failed to complete tournament registration.');
    } finally {
      setSubmittingReg(false);
    }
  };

  const handleWithdraw = async () => {
    if (!currentUser) return;
    if (!window.confirm('Confirm withdrawal of your squad from this tournament?')) return;

    try {
      await withdrawTeamFromTournament(tournament.id, currentUser.uid);
      const updated = await getTournamentById(tournament.id);
      if (updated) setTournament(updated);
      setActionSuccess('Squad registration withdrawn.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to withdraw.');
    }
  };

  const handleGenerateBracket = async () => {
    if (!window.confirm(`Generate official ${tournament.format} bracket using the ${registrations.length} registered squads?`)) {
      return;
    }

    try {
      const teams = registrations.map((r) => ({ id: r.id, name: r.teamName }));
      if (tournament.format === 'single-elimination') {
        await generateSingleEliminationBracket(tournament.id, tournament.game, teams);
      } else {
        await generateRoundRobinSchedule(tournament.id, tournament.game, teams);
      }
      setActionSuccess('Tournament bracket generated successfully!');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to generate bracket.');
    }
  };

  const handleConfirmMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch || !currentUser) return;
    setSubmittingMatch(true);

    const winnerId = winnerTeam === 'A' ? selectedMatch.teamA.id : selectedMatch.teamB.id;
    const winnerName = winnerTeam === 'A' ? selectedMatch.teamA.name : selectedMatch.teamB.name;

    try {
      if (isAdmin) {
        await confirmTournamentMatchResult(selectedMatch.id, {
          scoreA: Number(scoreA),
          scoreB: Number(scoreB),
          winnerId,
          winnerName,
          adminUid: currentUser.uid
        });
        setActionSuccess('Match score and bracket advancement confirmed!');
      } else {
        await submitProposedMatchResult(selectedMatch.id, Number(scoreA), Number(scoreB), currentUser.uid);
        setActionSuccess('Proposed match score submitted for admin validation.');
      }

      setSelectedMatch(null);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to record match result.');
    } finally {
      setSubmittingMatch(false);
    }
  };

  // Group matches by round for Single Elimination bracket view
  const matchesByRound = useMemo(() => {
    return matches.reduce<Record<string, CompetitiveMatch[]>>((acc, m) => {
      const roundKey = typeof m.round === 'number' ? `Round ${m.round}` : String(m.round || 'Round 1');
      if (!acc[roundKey]) acc[roundKey] = [];
      acc[roundKey].push(m);
      return acc;
    }, {});
  }, [matches]);

  return (
    <div
      style={{
        paddingTop: '100px',
        minHeight: '100vh',
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '100px 20px 80px'
      }}
    >
      {/* Back button */}
      <Link
        to="/tournaments"
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
        <ArrowLeft size={16} /> Back to Tournaments Circuit
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

      {/* Tournament Hero Card */}
      <div
        style={{
          background: 'var(--dark2)',
          border: '1px solid rgba(255, 215, 0, 0.25)',
          borderRadius: '14px',
          padding: '36px',
          marginBottom: '32px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)'
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
                {tournament.game}
              </span>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '100px',
                  fontSize: '0.75rem',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 700,
                  backgroundColor: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  color: '#ffd700'
                }}
              >
                {tournament.format === 'single-elimination' ? 'Single Elimination' : 'Round Robin'}
              </span>
            </div>

            <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '2.2rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
              {tournament.name}
            </h1>

            <p style={{ color: '#7a9ab5', fontSize: '0.95rem', maxWidth: '750px', lineHeight: 1.5 }}>
              {tournament.description}
            </p>
          </div>

          {/* Registration & Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
            {isCaptainRegistered ? (
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
                  <CheckCircle2 size={16} /> SQUAD REGISTERED
                </span>
                <div>
                  <button
                    onClick={handleWithdraw}
                    className="btn-outline"
                    style={{ color: '#f87171', borderColor: 'rgba(239,68,68,0.3)', padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    Withdraw Squad
                  </button>
                </div>
              </div>
            ) : tournament.status === 'registration-open' ? (
              isCaptain || isAdmin ? (
                <button
                  onClick={() => setIsRegisterOpen(true)}
                  className="btn-primary"
                  style={{ padding: '12px 28px', fontSize: '0.95rem' }}
                >
                  Register Squad Lineup
                </button>
              ) : (
                <div style={{ color: '#facc15', fontSize: '0.85rem' }}>
                  Captaincy clearance required to register tournament team
                </div>
              )
            ) : null}

            {/* Admin Generate Bracket button */}
            {isAdmin && (
              <button
                onClick={handleGenerateBracket}
                style={{
                  background: 'linear-gradient(135deg, #ffd700, #b8860b)',
                  border: 'none',
                  color: '#000',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 0 14px rgba(255,215,0,0.3)'
                }}
              >
                <Play size={14} fill="#000" /> {matches.length > 0 ? 'Regenerate Bracket' : 'Generate Tournament Bracket'}
              </button>
            )}
          </div>
        </div>

        {/* Champion Callout Banner (if completed) */}
        {tournament.champion && (
          <div
            style={{
              marginTop: '28px',
              background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,140,0,0.15))',
              border: '2px solid #ffd700',
              borderRadius: '10px',
              padding: '20px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 0 30px rgba(255,215,0,0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Trophy size={42} color="#ffd700" />
              <div>
                <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.8rem', color: '#ffd700', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  CHAMPIONS CROWNED
                </span>
                <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.6rem', color: '#fff', fontWeight: 900 }}>
                  {tournament.champion}
                </h2>
                {tournament.runnerUp && (
                  <span style={{ fontSize: '0.85rem', color: '#8ca0b8' }}>
                    Runner-up: {tournament.runnerUp}
                  </span>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: '#ffd700', textTransform: 'uppercase' }}>Grand Prize</span>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>
                {tournament.prizePool}
              </div>
            </div>
          </div>
        )}

        {/* Tactical Key Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginTop: '28px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: '#5a7a9a', textTransform: 'uppercase' }}>Tournament Start</span>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
              {formatTournamentDateTime(tournament.startDate)}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#5a7a9a', textTransform: 'uppercase' }}>Registration Deadline</span>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: 'var(--silver)', marginTop: '4px' }}>
              {formatTournamentDateTime(tournament.registrationDeadline)}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#5a7a9a', textTransform: 'uppercase' }}>Prize Pool</span>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: '#ffd700', marginTop: '4px' }}>
              {tournament.prizePool}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#5a7a9a', textTransform: 'uppercase' }}>Bracket Capacity</span>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: 'var(--cyan)', marginTop: '4px' }}>
              {registrations.length} of {tournament.maxTeams} Teams Seeded
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
        {[
          { id: 'bracket', label: 'Brackets & Matches' },
          { id: 'teams', label: `Participating Teams (${registrations.length})` },
          { id: 'rules', label: 'Rules & Guidelines' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              background: activeTab === tab.id ? 'linear-gradient(135deg,#1565c0,#0288d1)' : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.id ? '#fff' : '#7a9ab5',
              border: '1px solid',
              borderColor: activeTab === tab.id ? 'var(--cyan)' : 'rgba(255,255,255,0.08)',
              padding: '8px 20px',
              borderRadius: '6px',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: BRACKET & MATCHES */}
      {activeTab === 'bracket' && (
        <div>
          {matches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--dark2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Layers size={40} color="#4a6a8a" style={{ margin: '0 auto 14px' }} />
              <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.2rem', color: '#fff', marginBottom: '8px' }}>
                Bracket Pending Generation
              </h3>
              <p style={{ color: '#7a9ab5', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 20px' }}>
                Teams are currently registering. Once registrations conclude, the official tournament bracket will be seeded by administrators.
              </p>
              {isAdmin && registrations.length >= 2 && (
                <button onClick={handleGenerateBracket} className="btn-primary" style={{ padding: '8px 22px' }}>
                  Generate Bracket Now
                </button>
              )}
            </div>
          ) : tournament.format === 'single-elimination' ? (
            /* Single Elimination Bracket Viewer */
            <div style={{ display: 'flex', gap: '32px', overflowX: 'auto', paddingBottom: '20px' }}>
              {Object.entries(matchesByRound).map(([roundName, roundMatches]) => (
                <div key={roundName} style={{ minWidth: '280px', flex: 1 }}>
                  <div
                    style={{
                      fontFamily: 'Orbitron, monospace',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      color: 'var(--cyan)',
                      textTransform: 'uppercase',
                      padding: '8px 12px',
                      background: 'rgba(0,229,255,0.08)',
                      borderRadius: '6px',
                      marginBottom: '16px',
                      textAlign: 'center',
                      border: '1px solid rgba(0,229,255,0.2)'
                    }}
                  >
                    {roundName}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {roundMatches.map((m) => {
                      const isBye = m.teamB.id === 'bye';
                      const canManageMatch = isAdmin || (isCaptain && (m.teamA.name.includes(userProfile?.gamingUsername || '') || m.teamB.name.includes(userProfile?.gamingUsername || '')));

                      return (
                        <div
                          key={m.id}
                          style={{
                            background: 'var(--dark3)',
                            border: m.isConfirmed ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px',
                            padding: '16px',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#5a7a9a', marginBottom: '8px' }}>
                            <span>Match #{m.matchNumber || 1}</span>
                            <span>{m.isConfirmed ? '● Confirmed' : m.status}</span>
                          </div>

                          {/* Team A */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 10px',
                              borderRadius: '4px',
                              background: m.winnerName === m.teamA.name ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)',
                              color: m.winnerName === m.teamA.name ? '#4ade80' : '#fff',
                              fontFamily: 'Rajdhani, sans-serif',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              marginBottom: '6px'
                            }}
                          >
                            <span>{m.teamA.name}</span>
                            <span style={{ fontFamily: 'Orbitron, monospace' }}>{m.teamA.score !== undefined ? m.teamA.score : '—'}</span>
                          </div>

                          {/* Team B */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 10px',
                              borderRadius: '4px',
                              background: m.winnerName === m.teamB.name ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)',
                              color: m.winnerName === m.teamB.name ? '#4ade80' : '#fff',
                              fontFamily: 'Rajdhani, sans-serif',
                              fontWeight: 700,
                              fontSize: '0.95rem'
                            }}
                          >
                            <span>{isBye ? 'BYE (Advances)' : m.teamB.name}</span>
                            <span style={{ fontFamily: 'Orbitron, monospace' }}>{m.teamB.score !== undefined ? m.teamB.score : '—'}</span>
                          </div>

                          {/* Manage / Record Score Button */}
                          {!isBye && canManageMatch && (
                            <button
                              onClick={() => {
                                setSelectedMatch(m);
                                setScoreA(m.teamA.score || 0);
                                setScoreB(m.teamB.score || 0);
                              }}
                              style={{
                                marginTop: '12px',
                                width: '100%',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                color: '#8ca0b8',
                                padding: '6px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontFamily: 'Rajdhani, sans-serif',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                cursor: 'pointer'
                              }}
                            >
                              {isAdmin ? 'Confirm Match Result' : 'Propose Score'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Round Robin Table View */
            <div style={{ background: 'var(--dark2)', borderRadius: '10px', padding: '24px', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 style={{ fontFamily: 'Orbitron, monospace', color: '#fff', fontSize: '1.15rem', marginBottom: '16px' }}>
                Round Robin Matches & Standings
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {matches.map((m) => (
                  <div key={m.id} style={{ background: 'var(--dark3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#5a7a9a', marginBottom: '8px' }}>
                      <span>{m.round}</span>
                      <span>{m.isConfirmed ? '● Confirmed' : m.status}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                      <span>{m.teamA.name} ({m.teamA.score || 0})</span>
                      <span style={{ color: '#5a7a9a' }}>vs</span>
                      <span>{m.teamB.name} ({m.teamB.score || 0})</span>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setSelectedMatch(m);
                          setScoreA(m.teamA.score || 0);
                          setScoreB(m.teamB.score || 0);
                        }}
                        style={{
                          marginTop: '10px',
                          width: '100%',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#8ca0b8',
                          padding: '6px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        Confirm Result
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PARTICIPATING TEAMS */}
      {activeTab === 'teams' && (
        <div
          style={{
            background: 'var(--dark2)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '28px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.2rem', color: '#fff' }}>
              Enrolled Squad Rosters
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--cyan)' }}>
              {registrations.length} of {tournament.maxTeams} Teams
            </span>
          </div>

          {registrations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#5a7a9a' }}>
              <Users size={32} color="#4a6a8a" style={{ margin: '0 auto 10px' }} />
              <p>No squad lineups registered yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {registrations.map((reg, idx) => (
                <div
                  key={reg.id}
                  style={{
                    background: 'var(--dark3)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    padding: '18px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(255,215,0,0.1)',
                        border: '1px solid #ffd700',
                        color: '#ffd700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'Orbitron, monospace',
                        fontWeight: 700,
                        fontSize: '0.8rem'
                      }}
                    >
                      #{idx + 1}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                        {reg.teamName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#7a9ab5' }}>
                        Captain: {reg.captainName}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#8ca0b8', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                    <strong>Lineup:</strong> {reg.roster?.map((m) => m.name).join(', ') || 'Roster pending'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RULES & INFORMATION */}
      {activeTab === 'rules' && (
        <div
          style={{
            background: 'var(--dark2)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '32px'
          }}
        >
          <h3 style={{ fontFamily: 'Orbitron, monospace', color: '#fff', fontSize: '1.2rem', marginBottom: '16px' }}>
            Official Tournament Rulebook
          </h3>
          <p style={{ color: '#7a9ab5', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
            {tournament.rules || 'Standard Hoshima competitive guidelines apply. All participating operatives must hold verified status.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#5a7a9a', textTransform: 'uppercase' }}>Anti-Cheat & Emulators</span>
              <p style={{ color: '#fff', fontSize: '0.88rem', marginTop: '4px' }}>Strictly prohibited. Third-party overlay tools result in immediate disqualification.</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#5a7a9a', textTransform: 'uppercase' }}>Lobby Disconnects</span>
              <p style={{ color: '#fff', fontSize: '0.88rem', marginTop: '4px' }}>Matches will only restart if 2 or more operatives disconnect within the first 60 seconds.</p>
            </div>
          </div>
        </div>
      )}

      {/* Team Registration Modal */}
      {isRegisterOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3 style={{ fontFamily: 'Orbitron, monospace', color: '#fff', fontSize: '1.25rem', marginBottom: '8px' }}>
              Register Squad for Tournament
            </h3>
            <p style={{ color: '#7a9ab5', fontSize: '0.85rem', marginBottom: '20px' }}>
              Enroll your lineup in the official tournament bracket.
            </p>

            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Squad Team Name *
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Hoshima Alpha Squad"
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
                  Captain Tactical Coordinate (Discord Handle / IGN)
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. Discord: @captain_99"
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

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: '#ffd700', textTransform: 'uppercase', fontWeight: 700 }}>
                  Active Lineup Callsigns (4 Operatives)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <input
                    type="text"
                    required
                    placeholder="Operative 1 (Captain)"
                    value={player1Name}
                    onChange={(e) => setPlayer1Name(e.target.value)}
                    style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '4px', padding: '8px', color: '#fff' }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Operative 2"
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '4px', padding: '8px', color: '#fff' }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Operative 3"
                    value={player3Name}
                    onChange={(e) => setPlayer3Name(e.target.value)}
                    style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '4px', padding: '8px', color: '#fff' }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Operative 4"
                    value={player4Name}
                    onChange={(e) => setPlayer4Name(e.target.value)}
                    style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '4px', padding: '8px', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsRegisterOpen(false)} className="btn-outline" style={{ padding: '8px 18px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submittingReg} className="btn-primary" style={{ padding: '8px 24px' }}>
                  {submittingReg ? 'Enrolling...' : 'Confirm Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Match Modal */}
      {selectedMatch && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontFamily: 'Orbitron, monospace', color: '#fff', fontSize: '1.25rem', marginBottom: '8px' }}>
              {isAdmin ? 'Confirm Match Result' : 'Propose Match Result'}
            </h3>
            <p style={{ color: '#7a9ab5', fontSize: '0.85rem', marginBottom: '20px' }}>
              {isAdmin
                ? 'Official confirmation advances winner into the next bracket round.'
                : 'Proposed score will be sent to administrators for validation.'}
            </p>

            <form onSubmit={handleConfirmMatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px' }}>
                    {selectedMatch.teamA.name} Score *
                  </label>
                  <input
                    type="number"
                    required
                    value={scoreA}
                    onChange={(e) => setScoreA(Number(e.target.value))}
                    style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px' }}>
                    {selectedMatch.teamB.name} Score *
                  </label>
                  <input
                    type="number"
                    required
                    value={scoreB}
                    onChange={(e) => setScoreB(Number(e.target.value))}
                    style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#7a9ab5', marginBottom: '6px' }}>
                  Advancing Winner *
                </label>
                <select
                  value={winnerTeam}
                  onChange={(e) => setWinnerTeam(e.target.value as 'A' | 'B')}
                  style={{ width: '100%', background: 'var(--dark2)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                >
                  <option value="A">{selectedMatch.teamA.name} Wins</option>
                  <option value="B">{selectedMatch.teamB.name} Wins</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setSelectedMatch(null)} className="btn-outline" style={{ padding: '8px 18px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submittingMatch} className="btn-primary" style={{ padding: '8px 24px' }}>
                  {submittingMatch ? 'Submitting...' : isAdmin ? 'Confirm & Advance Winner' : 'Submit Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
