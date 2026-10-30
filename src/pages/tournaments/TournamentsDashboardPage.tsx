import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToTournaments,
  formatTournamentDateTime
} from '../../services/tournamentService';
import type { Tournament } from '../../types/competitive';
import { COMPETITIVE_GAMES } from '../../types/competitive';
import { CreateTournamentModal } from './CreateTournamentModal';
import {
  Trophy,
  Calendar,
  Users,
  Award,
  Plus,
  ArrowRight,
  Layers
} from 'lucide-react';

export const TournamentsDashboardPage: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToTournaments(
      (data) => {
        setTournaments(data);
        setLoading(false);
      },
      selectedGame,
      statusFilter
    );
    return () => unsub();
  }, [selectedGame, statusFilter]);

  const getStatusBadge = (t: Tournament) => {
    switch (t.status) {
      case 'registration-open':
        return (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '100px',
              fontSize: '0.72rem',
              fontWeight: 700,
              fontFamily: 'Rajdhani, sans-serif',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#4ade80'
            }}
          >
            ● Registration Open
          </span>
        );
      case 'in-progress':
        return (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '100px',
              fontSize: '0.72rem',
              fontWeight: 700,
              fontFamily: 'Rajdhani, sans-serif',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(0,229,255,0.12)',
              border: '1px solid var(--cyan)',
              color: 'var(--cyan)'
            }}
          >
            ● In Progress (Live Bracket)
          </span>
        );
      case 'completed':
        return (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '100px',
              fontSize: '0.72rem',
              fontWeight: 700,
              fontFamily: 'Rajdhani, sans-serif',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(255,215,0,0.1)',
              border: '1px solid rgba(255,215,0,0.3)',
              color: '#ffd700'
            }}
          >
            🏆 {t.champion ? `Champion: ${t.champion}` : 'Concluded'}
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '100px',
              fontSize: '0.72rem',
              fontWeight: 700,
              fontFamily: 'Rajdhani, sans-serif',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(234,179,8,0.1)',
              border: '1px solid rgba(234,179,8,0.3)',
              color: '#facc15'
            }}
          >
            {t.status}
          </span>
        );
    }
  };

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
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '36px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Trophy size={18} color="#ffd700" />
            <span
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                fontSize: '0.82rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#ffd700'
              }}
            >
              PREMIER COMPETITIVE CIRCUIT
            </span>
          </div>
          <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '2.2rem', fontWeight: 900, color: '#fff' }}>
            TOURNAMENTS & CUPS
          </h1>
          <p style={{ color: '#7a9ab5', fontSize: '0.95rem' }}>
            Official championship brackets, round-robin series, and seasonal prize tournaments.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary"
            style={{ padding: '10px 22px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> Create Tournament
          </button>
        )}
      </div>

      {/* Filter and Control Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
          background: 'var(--dark2)',
          padding: '14px 18px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        {/* Game Filters */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['All', ...COMPETITIVE_GAMES].map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGame(g)}
              style={{
                background: selectedGame === g ? 'linear-gradient(135deg,#1565c0,#0288d1)' : 'rgba(255,255,255,0.04)',
                color: selectedGame === g ? '#fff' : '#7a9ab5',
                border: '1px solid',
                borderColor: selectedGame === g ? 'var(--cyan)' : 'rgba(255,255,255,0.08)',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: 'var(--dark3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
            padding: '6px 12px',
            color: '#8ca0b8',
            fontSize: '0.82rem',
            outline: 'none'
          }}
        >
          <option value="all">All Tournaments</option>
          <option value="registration-open">Registration Open</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed (Champions)</option>
        </select>
      </div>

      {/* Tournament Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#5a7a9a' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '3px solid rgba(255, 215, 0, 0.2)',
              borderTopColor: '#ffd700',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}
          />
          <p style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            LOADING TOURNAMENT BRACKETS...
          </p>
        </div>
      ) : tournaments.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--dark2)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <Trophy size={40} color="#4a6a8a" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.15rem', color: '#fff', marginBottom: '8px' }}>
            No Tournaments Found
          </h3>
          <p style={{ color: '#7a9ab5', fontSize: '0.88rem', marginBottom: '20px' }}>
            No competitive tournaments match the selected game division or status filter.
          </p>
          {isAdmin && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-primary"
              style={{ padding: '8px 20px', fontSize: '0.85rem' }}
            >
              Initialize First Tournament
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '24px'
          }}
        >
          {tournaments.map((t) => {
            const fillRatio = (t.currentTeams || 0) / t.maxTeams;

            return (
              <div
                key={t.id}
                style={{
                  backgroundColor: 'var(--dark3)',
                  border: t.status === 'completed' ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,.07)',
                  borderRadius: '12px',
                  padding: '26px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: t.status === 'completed' ? '0 0 20px rgba(255,215,0,0.08)' : 'none',
                  transition: 'transform 0.2s, border-color 0.2s'
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        fontFamily: 'Rajdhani, sans-serif',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        backgroundColor: 'rgba(0,229,255,0.08)',
                        border: '1px solid rgba(0,229,255,0.2)',
                        color: 'var(--cyan)'
                      }}
                    >
                      {t.game}
                    </span>
                    {getStatusBadge(t)}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontFamily: 'Orbitron, monospace',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: '#fff',
                      marginBottom: '8px',
                      lineHeight: 1.3
                    }}
                  >
                    {t.name}
                  </h3>

                  {/* Prize Banner */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(255,215,0,0.08)',
                      border: '1px solid rgba(255,215,0,0.25)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      marginBottom: '18px',
                      color: '#ffd700',
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}
                  >
                    <Trophy size={16} color="#ffd700" style={{ flexShrink: 0 }} />
                    <span>{t.prizePool || 'Championship Trophy & Medals'}</span>
                  </div>

                  {/* Tactical Specs */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      marginBottom: '18px',
                      background: 'rgba(255,255,255,0.02)',
                      padding: '12px',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7a9ab5', fontSize: '0.8rem' }}>
                      <Calendar size={14} color="var(--cyan)" />
                      <span>{formatTournamentDateTime(t.startDate)}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7a9ab5', fontSize: '0.8rem' }}>
                      <Layers size={14} color="#ffd600" />
                      <span>{t.format === 'single-elimination' ? 'Single Elimination' : 'Round Robin'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7a9ab5', fontSize: '0.8rem' }}>
                      <Users size={14} color="#a855f7" />
                      <span>
                        {t.currentTeams || 0} / {t.maxTeams} Teams
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7a9ab5', fontSize: '0.8rem' }}>
                      <Award size={14} color="#4ade80" />
                      <span>Verified Circuit</span>
                    </div>
                  </div>

                  {/* Bracket Fill Progress */}
                  <div style={{ marginBottom: '22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#5a7a9a', marginBottom: '6px' }}>
                      <span>Team Bracket Capacity</span>
                      <span>{Math.round(fillRatio * 100)}% Filled</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, fillRatio * 100)}%`,
                          height: '100%',
                          backgroundColor: fillRatio >= 1 ? '#ff4655' : fillRatio >= 0.75 ? '#facc15' : 'var(--cyan)',
                          transition: 'width 0.3s'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Button */}
                <Link
                  to={`/tournaments/${t.id}`}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    padding: '10px 18px',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    textDecoration: 'none'
                  }}
                >
                  View Brackets & Matches <ArrowRight size={15} />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Tournament Modal */}
      <CreateTournamentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(id) => {
          navigate(`/tournaments/${id}`);
        }}
      />
    </div>
  );
};
