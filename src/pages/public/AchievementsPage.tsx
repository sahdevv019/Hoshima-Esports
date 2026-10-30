import React from 'react';
import { Trophy, Award, Flame } from 'lucide-react';

export const AchievementsPage: React.FC = () => {
  const championships = [
    {
      year: '2026',
      title: 'South Asia Championship Season 4',
      game: 'Free Fire Max',
      place: '1ST PLACE — CHAMPIONS',
      prize: '₹2,500,000',
      badge: '#ffd700'
    },
    {
      year: '2025',
      title: 'BGMI National Invitational Pro Series',
      game: 'BGMI',
      place: '1ST PLACE — CHAMPIONS',
      prize: '₹1,800,000',
      badge: '#ffd700'
    },
    {
      year: '2025',
      title: 'Valorant Challengers South Asia',
      game: 'Valorant',
      place: 'RUNNER UP — 2ND PLACE',
      prize: '₹750,000',
      badge: '#e0e8f0'
    },
    {
      year: '2024',
      title: 'MLBB Masters Cup India Qualifier',
      game: 'Mobile Legends',
      place: '1ST PLACE — CHAMPIONS',
      prize: '₹500,000',
      badge: '#ffd700'
    }
  ];

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', maxWidth: '1100px', margin: '0 auto', padding: '100px 20px 60px' }}>
      <div className="section-header">
        <p className="section-tag">Competitive Legacy</p>
        <h1 className="section-title">
          OUR <span>ACHIEVEMENTS</span>
        </h1>
        <div className="section-line" />
        <p style={{ color: '#5a7a9a', marginTop: '14px', fontSize: '1rem' }}>
          Trophies, tournament finishes, and international accolades earned by Hoshima rosters
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '60px' }}>
        <div style={{ background: 'var(--dark3)', border: '1px solid rgba(255,215,0,.2)', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
          <Trophy size={36} color="#ffd700" style={{ marginBottom: '12px' }} />
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '2rem', fontWeight: 900, color: '#fff' }}>15</div>
          <p style={{ fontFamily: 'Rajdhani, sans-serif', color: '#ffd700', fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Championship Cups
          </p>
        </div>

        <div style={{ background: 'var(--dark3)', border: '1px solid rgba(0,229,255,.2)', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
          <Award size={36} color="var(--cyan)" style={{ marginBottom: '12px' }} />
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '2rem', fontWeight: 900, color: '#fff' }}>24</div>
          <p style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--cyan)', fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Grand Final Appearances
          </p>
        </div>

        <div style={{ background: 'var(--dark3)', border: '1px solid rgba(255,70,85,.2)', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
          <Flame size={36} color="#ff4655" style={{ marginBottom: '12px' }} />
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '2rem', fontWeight: 900, color: '#fff' }}>₹7.5M+</div>
          <p style={{ fontFamily: 'Rajdhani, sans-serif', color: '#ff4655', fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Prize Money Secured
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {championships.map((c, i) => (
          <div
            key={i}
            style={{
              background: 'var(--dark3)',
              border: '1px solid rgba(255,255,255,.07)',
              borderRadius: '8px',
              padding: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '0.75rem',
                  color: 'var(--cyan)',
                  padding: '2px 8px',
                  background: 'rgba(0,229,255,.1)',
                  borderRadius: '4px',
                  marginRight: '12px'
                }}
              >
                {c.year}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#8ca0b8', textTransform: 'uppercase' }}>{c.game}</span>
              <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.15rem', color: '#fff', marginTop: '6px' }}>
                {c.title}
              </h3>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: c.badge, fontSize: '1rem', letterSpacing: '0.1em' }}>
                {c.place}
              </div>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.85rem', color: '#4a6a8a', marginTop: '4px' }}>
                Prize: {c.prize}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
