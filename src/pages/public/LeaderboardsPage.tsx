import React, { useState, useEffect, useMemo } from 'react';
import {
  getTeamLeaderboard,
  getPlayerLeaderboard
} from '../../services/statsService';
import type {
  TeamLeaderboardEntry,
  PlayerCompetitiveStats
} from '../../types/competitive';
import { COMPETITIVE_GAMES } from '../../types/competitive';
import {
  Trophy,
  Users,
  Award,
  Search,
  Crosshair
} from 'lucide-react';

export const LeaderboardsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'squads' | 'players'>('squads');
  const [selectedGame, setSelectedGame] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [squads, setSquads] = useState<TeamLeaderboardEntry[]>([]);
  const [players, setPlayers] = useState<PlayerCompetitiveStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      getTeamLeaderboard(selectedGame),
      getPlayerLeaderboard(selectedGame)
    ])
      .then(([squadData, playerData]) => {
        if (!isMounted) return;
        setSquads(squadData);
        setPlayers(playerData);
      })
      .catch((err) => {
        console.error('[LeaderboardsPage] Error fetching standings:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedGame]);

  const filteredSquads = useMemo(
    () =>
      squads.filter(
        (s) =>
          s.squadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.game.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [squads, searchQuery]
  );

  const filteredPlayers = useMemo(
    () =>
      players.filter(
        (p) =>
          p.gamingUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.squad.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [players, searchQuery]
  );

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ffd700', fontWeight: 800 }}>
          <Trophy size={16} /> 1ST
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e2e8f0', fontWeight: 800 }}>
          <Award size={16} /> 2ND
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 800 }}>
          <Award size={16} /> 3RD
        </div>
      );
    }
    return (
      <span
        style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: '0.85rem',
          color: '#64748b',
          fontWeight: 700
        }}
      >
        #{rank}
      </span>
    );
  };

  return (
    <div
      style={{
        paddingTop: '110px',
        minHeight: '100vh',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '110px 24px 80px'
      }}
    >
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '32px' }}>
        <p className="section-tag">Competitive Standings & Hall of Valor</p>
        <h1 className="section-title">
          GLOBAL <span>LEADERBOARDS</span>
        </h1>
        <div className="section-line" />
        <p
          style={{
            fontFamily: 'Exo 2, sans-serif',
            color: '#7a9ab5',
            fontSize: '0.95rem',
            maxWidth: '680px',
            margin: '12px auto 0',
            lineHeight: 1.6
          }}
        >
          Verified rankings, frag counts, and team win-rates aggregated from official
          division scrims and tournament championship matches.
        </p>
      </div>

      {/* Primary Tab Switcher */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '28px'
        }}
      >
        <button
          onClick={() => setActiveTab('squads')}
          style={{
            background: activeTab === 'squads' ? 'var(--cyan)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'squads' ? '#000' : '#8ca0b8',
            border: activeTab === 'squads' ? '1px solid var(--cyan)' : '1px solid rgba(255,255,255,0.1)',
            padding: '10px 28px',
            borderRadius: '8px',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '0.95rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'squads' ? '0 0 20px rgba(0, 229, 255, 0.4)' : 'none'
          }}
        >
          <Users size={16} /> Division Standings
        </button>

        <button
          onClick={() => setActiveTab('players')}
          style={{
            background: activeTab === 'players' ? 'var(--cyan)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'players' ? '#000' : '#8ca0b8',
            border: activeTab === 'players' ? '1px solid var(--cyan)' : '1px solid rgba(255,255,255,0.1)',
            padding: '10px 28px',
            borderRadius: '8px',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '0.95rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'players' ? '0 0 20px rgba(0, 229, 255, 0.4)' : 'none'
          }}
        >
          <Crosshair size={16} /> Operative Fraggers
        </button>
      </div>

      {/* Control Bar: Division Filter + Search */}
      <div
        style={{
          background: 'rgba(10, 15, 29, 0.7)',
          border: '1px solid rgba(0, 229, 255, 0.15)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {/* Game Division Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedGame('All')}
            style={{
              background: selectedGame === 'All' ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
              color: selectedGame === 'All' ? 'var(--cyan)' : '#7a9ab5',
              border: selectedGame === 'All' ? '1px solid var(--cyan)' : '1px solid rgba(255,255,255,0.08)',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Rajdhani, sans-serif',
              textTransform: 'uppercase'
            }}
          >
            All Divisions
          </button>
          {COMPETITIVE_GAMES.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGame(g)}
              style={{
                background: selectedGame === g ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                color: selectedGame === g ? 'var(--cyan)' : '#7a9ab5',
                border: selectedGame === g ? '1px solid var(--cyan)' : '1px solid rgba(255,255,255,0.08)',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Rajdhani, sans-serif',
                textTransform: 'uppercase'
              }}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '240px', flex: '1', maxWidth: '340px' }}>
          <Search
            size={16}
            color="#4a6a8a"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'squads' ? 'Filter by squad...' : 'Filter by IGN or squad...'}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '8px 12px 8px 36px',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
              fontFamily: 'Exo 2, sans-serif'
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
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
          <p style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#7a9ab5' }}>
            SYNCHRONIZING VERIFIED COMBAT RECORDS...
          </p>
        </div>
      ) : activeTab === 'squads' ? (
        /* SQUAD STANDINGS */
        filteredSquads.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--dark2)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px'
            }}
          >
            <Trophy size={40} color="#4a6a8a" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontFamily: 'Orbitron, monospace', color: '#fff', fontSize: '1.1rem' }}>No Squads Found</h3>
            <p style={{ color: '#7a9ab5', fontSize: '0.85rem' }}>No squads match the selected filter criteria.</p>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--dark2)',
              border: '1px solid rgba(0, 229, 255, 0.15)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: '0.78rem',
                      color: '#4a6a8a',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase'
                    }}
                  >
                    <th style={{ padding: '16px 20px', width: '90px' }}>Rank</th>
                    <th style={{ padding: '16px 20px' }}>Squad Division</th>
                    <th style={{ padding: '16px 20px' }}>Game</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center' }}>Matches</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center' }}>W / L</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center' }}>Win Rate</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center' }}>Trophies</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right' }}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSquads.map((squad, idx) => {
                    const rank = idx + 1;
                    return (
                      <tr
                        key={squad.squadName}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          background: rank === 1 ? 'rgba(255, 215, 0, 0.03)' : 'transparent',
                          transition: 'background 0.2s ease'
                        }}
                      >
                        <td style={{ padding: '16px 20px' }}>{getRankBadge(rank)}</td>
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            style={{
                              fontFamily: 'Orbitron, monospace',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              color: rank === 1 ? '#ffd700' : '#fff',
                              display: 'block'
                            }}
                          >
                            {squad.squadName}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            style={{
                              background: 'rgba(0, 229, 255, 0.08)',
                              border: '1px solid rgba(0, 229, 255, 0.2)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: 'var(--cyan)',
                              fontFamily: 'Rajdhani, sans-serif',
                              fontWeight: 600
                            }}
                          >
                            {squad.game}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center', color: '#8ca0b8', fontSize: '0.9rem' }}>
                          {squad.matchesPlayed}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: '0.9rem' }}>
                          <span style={{ color: '#4ade80', fontWeight: 600 }}>{squad.wins}</span>
                          <span style={{ color: '#4a6a8a', margin: '0 4px' }}>/</span>
                          <span style={{ color: '#f87171' }}>{squad.losses}</span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontFamily: 'Orbitron, monospace',
                                fontSize: '0.85rem',
                                color: squad.winRate >= 70 ? '#4ade80' : '#ffd700'
                              }}
                            >
                              {squad.winRate}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ffd700', fontSize: '0.85rem' }}>
                            <Award size={14} /> {squad.trophies}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <span
                            style={{
                              fontFamily: 'Orbitron, monospace',
                              fontSize: '1.05rem',
                              fontWeight: 800,
                              color: 'var(--cyan)'
                            }}
                          >
                            {squad.points}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* PLAYER RANKINGS */
        filteredPlayers.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--dark2)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px'
            }}
          >
            <Crosshair size={40} color="#4a6a8a" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontFamily: 'Orbitron, monospace', color: '#fff', fontSize: '1.1rem' }}>No Players Found</h3>
            <p style={{ color: '#7a9ab5', fontSize: '0.85rem' }}>No operatives match the selected search query.</p>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--dark2)',
              border: '1px solid rgba(0, 229, 255, 0.15)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: '0.78rem',
                      color: '#4a6a8a',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase'
                    }}
                  >
                    <th style={{ padding: '16px 20px', width: '90px' }}>Rank</th>
                    <th style={{ padding: '16px 20px' }}>Operative IGN</th>
                    <th style={{ padding: '16px 20px' }}>Division Squad</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center' }}>Matches</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center' }}>Total Frags</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center' }}>K/D Ratio</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center' }}>Win Rate</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right' }}>Recent Form</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player, idx) => {
                    const rank = idx + 1;
                    return (
                      <tr
                        key={player.uid || player.gamingUsername}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          background: rank === 1 ? 'rgba(0, 229, 255, 0.03)' : 'transparent',
                          transition: 'background 0.2s ease'
                        }}
                      >
                        <td style={{ padding: '16px 20px' }}>{getRankBadge(rank)}</td>
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            style={{
                              fontFamily: 'Orbitron, monospace',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              color: rank === 1 ? 'var(--cyan)' : '#fff',
                              display: 'block'
                            }}
                          >
                            {player.gamingUsername}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#7a9ab5' }}>
                            {player.displayName}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            style={{
                              fontSize: '0.85rem',
                              color: '#cbd5e1',
                              fontFamily: 'Rajdhani, sans-serif',
                              fontWeight: 600
                            }}
                          >
                            {player.squad}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center', color: '#8ca0b8', fontSize: '0.9rem' }}>
                          {player.matchesPlayed}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span
                            style={{
                              fontFamily: 'Orbitron, monospace',
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              color: '#ff4655'
                            }}
                          >
                            {player.totalKills}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span
                            style={{
                              fontFamily: 'Orbitron, monospace',
                              fontSize: '0.9rem',
                              color: player.kdRatio >= 3.0 ? '#4ade80' : '#ffd700'
                            }}
                          >
                            {player.kdRatio}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span
                            style={{
                              fontFamily: 'Orbitron, monospace',
                              fontSize: '0.85rem',
                              color: '#a855f7'
                            }}
                          >
                            {player.winRate}%
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '4px' }}>
                            {player.recentForm && player.recentForm.length > 0 ? (
                              player.recentForm.map((outcome, fIdx) => (
                                <span
                                  key={fIdx}
                                  style={{
                                    display: 'inline-block',
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '3px',
                                    background: outcome === 'W' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                    color: outcome === 'W' ? '#4ade80' : '#ef4444',
                                    border: outcome === 'W' ? '1px solid #4ade80' : '1px solid #ef4444',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    lineHeight: '18px',
                                    textAlign: 'center',
                                    fontFamily: 'Orbitron, monospace'
                                  }}
                                >
                                  {outcome}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#4a6a8a' }}>N/A</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default LeaderboardsPage;
