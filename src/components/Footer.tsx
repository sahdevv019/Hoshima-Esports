import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255,255,255,.07)',
        padding: '60px 40px',
        backgroundColor: 'var(--dark2)',
        marginTop: '80px',
        position: 'relative',
        zIndex: 10
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px'
        }}
      >
        <div style={{ gridColumn: 'span 1' }}>
          <div className="nav-logo" style={{ marginBottom: '16px' }}>
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
              <path
                d="M38 40 C36 36 32 34 28 36 C22 38 20 46 24 52 C28 58 36 62 44 60 L50 58 L56 60 C64 62 72 58 76 52 C80 46 78 38 72 36 C68 34 64 36 62 40"
                stroke="#a8d8f0"
                strokeWidth="3"
                fill="none"
              />
              <ellipse cx="35" cy="44" rx="5" ry="6" fill="#a8d8f0" />
              <ellipse cx="65" cy="44" rx="5" ry="6" fill="#a8d8f0" />
              <path d="M40 32 C42 24 46 18 50 14 C54 18 58 24 60 32" stroke="#00e5ff" strokeWidth="2" fill="none" />
            </svg>
            <span className="nav-logo-text" style={{ fontSize: '1.1rem' }}>
              HOSHIMA
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', color: '#4a6a8a', lineHeight: 1.7, maxWidth: '280px' }}>
            Dominating the battlefield across Free Fire Max, BGMI, Valorant, and Mobile Legends.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                color: 'var(--cyan)'
              }}
            >
              X
            </span>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                color: 'var(--cyan)'
              }}
            >
              IG
            </span>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                color: 'var(--cyan)'
              }}
            >
              YT
            </span>
          </div>
        </div>

        <div>
          <h4
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#fff',
              marginBottom: '18px'
            }}
          >
            Tactical Hubs
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li>
              <Link to="/game/ff" style={{ color: '#4a6a8a', textDecoration: 'none', fontSize: '0.9rem' }}>
                Free Fire Max
              </Link>
            </li>
            <li>
              <Link to="/game/bgmi" style={{ color: '#4a6a8a', textDecoration: 'none', fontSize: '0.9rem' }}>
                BGMI
              </Link>
            </li>
            <li>
              <Link to="/game/val" style={{ color: '#4a6a8a', textDecoration: 'none', fontSize: '0.9rem' }}>
                Valorant
              </Link>
            </li>
            <li>
              <Link to="/game/ml" style={{ color: '#4a6a8a', textDecoration: 'none', fontSize: '0.9rem' }}>
                Mobile Legends
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#fff',
              marginBottom: '18px'
            }}
          >
            Organization
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li>
              <Link to="/teams" style={{ color: '#4a6a8a', textDecoration: 'none', fontSize: '0.9rem' }}>
                The Squad
              </Link>
            </li>
            <li>
              <Link to="/achievements" style={{ color: '#4a6a8a', textDecoration: 'none', fontSize: '0.9rem' }}>
                Championships
              </Link>
            </li>
            <li>
              <Link to="/recruitment" style={{ color: '#4a6a8a', textDecoration: 'none', fontSize: '0.9rem' }}>
                Recruitment
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#fff',
              marginBottom: '18px'
            }}
          >
            Security & Spark
          </h4>
          <p style={{ fontSize: '0.82rem', color: '#3a5a7a', lineHeight: 1.6 }}>
            Protected by Cloud Firestore least-privilege security rules and Google Identity.
          </p>
        </div>
      </div>

      <div
        style={{
          maxWidth: '1200px',
          margin: '36px auto 0',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#2a4a6a',
          fontSize: '0.8rem'
        }}
      >
        <span>© 2026 Hoshima Esports. All rights reserved.</span>
        <span>Built for Competitive Dominance</span>
      </div>
    </footer>
  );
};
