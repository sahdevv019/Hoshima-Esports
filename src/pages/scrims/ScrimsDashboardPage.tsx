import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToScrims,
  getUserScrimRegistrations,
  formatScrimDateTime
} from '../../services/scrimService';
import type { Scrim, ScrimRegistration } from '../../types/competitive';
import { COMPETITIVE_GAMES } from '../../types/competitive';
import { CreateScrimModal } from './CreateScrimModal';
import {
  Crosshair,
  Calendar,
  Users,
  MapPin,
  Plus,
  ArrowRight,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';

const GAME_IDS: Record<string, string> = {
  'Free Fire Max': 'ff',
  'BGMI': 'bgmi',
  'Valorant': 'val',
  'Mobile Legends': 'ml'
};

export const ScrimsDashboardPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();

  const [scrims, setScrims] = useState<Scrim[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<ScrimRegistration[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'my-scrims'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const canCreate = role === 'admin' || role === 'captain';

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToScrims(
      (data) => {
        setScrims(data);
        setLoading(false);
      },
      selectedGame,
      statusFilter
    );
    return () => unsub();
  }, [selectedGame, statusFilter]);

  useEffect(() => {
    if (currentUser) {
      getUserScrimRegistrations(currentUser.uid)
        .then(setUserRegistrations)
        .catch(console.error);
    } else {
      setUserRegistrations([]);
    }
  }, [currentUser, scrims]);

  const registeredScrimIds = useMemo(
    () => new Set(userRegistrations.map((r) => r.scrimId)),
    [userRegistrations]
  );

  const filteredScrims = useMemo(
    () => (activeTab === 'my-scrims' ? scrims.filter((s) => registeredScrimIds.has(s.id)) : scrims),
    [activeTab, scrims, registeredScrimIds]
  );

  const getStatusBadge = (scrim: Scrim) => {
    switch (scrim.status) {
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
            ● Open for Registration
          </span>
        );
      case 'registration-closed':
        return (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '100px',
              fontSize: '0.72rem',
              fontWeight: 700,
              fontFamily: 'Rajdhani, sans-serif',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171'
            }}
          >
            ● Roster Full
          </span>
        );
      case 'live':
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
            ● Match Live
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
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#8ca0b8'
            }}
          >
            Completed
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
            {scrim.status}
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
            <Crosshair size={18} color="var(--cyan)" />
            <span
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                fontSize: '0.82rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--cyan)'
              }}
            >
              COMPETITIVE DRILLS & MATCH CONTROL
            </span>
          </div>
          <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '2.2rem', fontWeight: 900, color: '#fff' }}>
            SCRIM OPERATIONS HUB
          </h1>
          <p style={{ color: '#7a9ab5', fontSize: '0.95rem' }}>
            Join practice matches, verify squad lineups, and coordinate real-time lobbies in #scrim-lobby.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary"
            style={{ padding: '10px 22px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> Host Competitive Scrim
          </button>
        )}
      </div>

      {/* Tabs and Controls Bar */}
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
        {/* View Switcher */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              background: activeTab === 'all' ? 'rgba(0,229,255,0.1)' : 'transparent',
              color: activeTab === 'all' ? 'var(--cyan)' : '#7a9ab5',
              border: '1px solid',
              borderColor: activeTab === 'all' ? 'var(--cyan)' : 'transparent',
              padding: '6px 14px',
              borderRadius: '6px',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            All Scrims ({scrims.length})
          </button>
          {currentUser && (
            <button
              onClick={() => setActiveTab('my-scrims')}
              style={{
                background: activeTab === 'my-scrims' ? 'rgba(0,229,255,0.1)' : 'transparent',
                color: activeTab === 'my-scrims' ? 'var(--cyan)' : '#7a9ab5',
                border: '1px solid',
                borderColor: activeTab === 'my-scrims' ? 'var(--cyan)' : 'transparent',
                padding: '6px 14px',
                borderRadius: '6px',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              My Registered ({userRegistrations.length})
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Game filter */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['All', ...COMPETITIVE_GAMES].map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGame(g)}
                style={{
                  background: selectedGame === g ? 'linear-gradient(135deg,#1565c0,#0288d1)' : 'rgba(255,255,255,0.04)',
                  color: selectedGame === g ? '#fff' : '#7a9ab5',
                  border: '1px solid',
                  borderColor: selectedGame === g ? 'var(--cyan)' : 'rgba(255,255,255,0.08)',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: 'var(--dark3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '4px',
              padding: '6px 10px',
              color: '#8ca0b8',
              fontSize: '0.8rem',
              outline: 'none'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="registration-open">Registration Open</option>
            <option value="registration-closed">Registration Closed</option>
            <option value="live">Live Matches</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Scrims Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#5a7a9a' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '3px solid rgba(0, 229, 255, 0.2)',
              borderTopColor: 'var(--cyan)',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}
          />
          <p style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            SCANNING TACTICAL SCRIM DIRECTORY...
          </p>
        </div>
      ) : filteredScrims.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--dark2)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <Crosshair size={40} color="#4a6a8a" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.15rem', color: '#fff', marginBottom: '8px' }}>
            No Scrims Found
          </h3>
          <p style={{ color: '#7a9ab5', fontSize: '0.88rem', marginBottom: '20px' }}>
            {activeTab === 'my-scrims'
              ? 'You have not registered for any upcoming scrimmage drills.'
              : 'No competitive scrim matches match the selected division or status criteria.'}
          </p>
          {canCreate && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-primary"
              style={{ padding: '8px 20px', fontSize: '0.85rem' }}
            >
              Host New Scrim
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}
        >
          {filteredScrims.map((scrim) => {
            const isRegistered = registeredScrimIds.has(scrim.id);
            const fillRatio = (scrim.currentParticipants || 0) / scrim.maxParticipants;
            const gameKey = GAME_IDS[scrim.game] || 'ff';

            return (
              <div
                key={scrim.id}
                style={{
                  backgroundColor: 'var(--dark3)',
                  border: isRegistered ? '1px solid var(--cyan)' : '1px solid rgba(255,255,255,.07)',
                  borderRadius: '10px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isRegistered ? '0 0 16px rgba(0,229,255,0.1)' : 'none',
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
                      {scrim.game}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isRegistered && (
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#4ade80',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            fontFamily: 'Rajdhani, sans-serif'
                          }}
                        >
                          <CheckCircle2 size={13} /> Registered
                        </span>
                      )}
                      {getStatusBadge(scrim)}
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontFamily: 'Orbitron, monospace',
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: '#fff',
                      marginBottom: '12px',
                      lineHeight: 1.3
                    }}
                  >
                    {scrim.title}
                  </h3>

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
                      <span>{formatScrimDateTime(scrim.scheduledTime)}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7a9ab5', fontSize: '0.8rem' }}>
                      <MapPin size={14} color="#ffd600" />
                      <span>{scrim.map || 'Bermuda'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7a9ab5', fontSize: '0.8rem' }}>
                      <Crosshair size={14} color="#ff4655" />
                      <span>{scrim.format}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7a9ab5', fontSize: '0.8rem' }}>
                      <Users size={14} color="#a855f7" />
                      <span>
                        {scrim.currentParticipants || 0} / {scrim.maxParticipants} Squads
                      </span>
                    </div>
                  </div>

                  {/* Capacity Progress Bar */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#5a7a9a', marginBottom: '6px' }}>
                      <span>Roster Slots</span>
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

                {/* Card Actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link
                    to={`/scrims/${scrim.id}`}
                    className="btn-primary"
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '10px 14px',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      textDecoration: 'none'
                    }}
                  >
                    Briefing & Lineup <ArrowRight size={14} />
                  </Link>

                  <Link
                    to={`/game/${gameKey}`}
                    className="btn-outline"
                    title="Open #scrim-lobby comms"
                    style={{
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none'
                    }}
                  >
                    <MessageSquare size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Scrim Modal */}
      <CreateScrimModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(id) => {
          navigate(`/scrims/${id}`);
        }}
      />
    </div>
  );
};
