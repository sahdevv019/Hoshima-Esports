import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GAMES_DATA } from '../../data/defaultGames';
import { Users, MessageSquare, ArrowRight, Crosshair } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { userProfile, role } = useAuth();

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
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--cyan)'
            }}
          >
            Tactical Operations Command
          </span>
          <span className={`role-badge-${role}`}>{role?.toUpperCase()} CLEARANCE</span>
        </div>
        <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '2.2rem', fontWeight: 900, color: '#fff' }}>
          Welcome back, {userProfile?.gamingUsername || userProfile?.displayName}
        </h1>
        <p style={{ color: '#7a9ab5', fontSize: '1rem' }}>
          Official member hub: tactical boards, scrimmage lobbies, and squad comms
        </p>
      </div>

      {/* Quick Action Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '50px'
        }}
      >
        <div
          style={{
            background: 'var(--dark3)',
            border: '1px solid rgba(0, 229, 255, 0.15)',
            borderRadius: '12px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0,229,255,.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cyan)',
                marginBottom: '16px'
              }}
            >
              <Crosshair size={24} />
            </div>
            <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.15rem', color: '#fff', marginBottom: '8px' }}>
              Scrimmage Coordination
            </h3>
            <p style={{ color: '#7a9ab5', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
              View today's scheduled 4v4 and full-lobby practice matches for all games.
            </p>
          </div>
          <Link to="/game/ff" className="btn-primary" style={{ padding: '10px 18px', fontSize: '0.88rem' }}>
            Enter Scrim Lobbies <ArrowRight size={14} />
          </Link>
        </div>

        <div
          style={{
            background: 'var(--dark3)',
            border: '1px solid rgba(0, 229, 255, 0.15)',
            borderRadius: '12px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                backgroundColor: 'rgba(224,64,251,.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e040fb',
                marginBottom: '16px'
              }}
            >
              <MessageSquare size={24} />
            </div>
            <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.15rem', color: '#fff', marginBottom: '8px' }}>
              Squad Comms Hub
            </h3>
            <p style={{ color: '#7a9ab5', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
              Real-time Firestore tactical messaging across #general, #strat-talk, and #scrim-lobby.
            </p>
          </div>
          <Link to="/game/val" className="btn-primary" style={{ padding: '10px 18px', fontSize: '0.88rem' }}>
            Open Comms Hub <ArrowRight size={14} />
          </Link>
        </div>

        <div
          style={{
            background: 'var(--dark3)',
            border: '1px solid rgba(0, 229, 255, 0.15)',
            borderRadius: '12px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,215,0,.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffd700',
                marginBottom: '16px'
              }}
            >
              <Users size={24} />
            </div>
            <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.15rem', color: '#fff', marginBottom: '8px' }}>
              Your Operative Profile
            </h3>
            <p style={{ color: '#7a9ab5', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
              Manage your in-game identity, preferred game division, and profile avatar color.
            </p>
          </div>
          <Link to="/profile" className="btn-outline" style={{ padding: '10px 18px', fontSize: '0.88rem' }}>
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Squad Hub Quick Links */}
      <div>
        <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.4rem', color: '#fff', marginBottom: '20px' }}>
          TACTICAL GAME HUBS
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {Object.values(GAMES_DATA).map((g) => (
            <Link
              key={g.id}
              to={`/game/${g.id}`}
              style={{
                background: 'var(--dark2)',
                border: '1px solid rgba(255,255,255,.08)',
                borderRadius: '8px',
                padding: '20px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all .2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--cyan)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div>
                <h4 style={{ fontFamily: 'Orbitron, monospace', color: '#fff', fontSize: '1rem', marginBottom: '4px' }}>
                  {g.name}
                </h4>
                <span style={{ fontSize: '0.78rem', color: '#4a6a8a' }}>{g.scrims.length} Active Scrims</span>
              </div>
              <ArrowRight size={18} color="var(--cyan)" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
