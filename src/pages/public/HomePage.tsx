import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ParticleBackground } from '../../components/ParticleBackground';
import { GAMES_DATA } from '../../data/defaultGames';
import { subscribeToRoster } from '../../services/rosterService';
import { subscribeToArcadeGames, addArcadeGame } from '../../services/arcadeService';
import type { RosterPlayer, ArcadeGame } from '../../types/roster';
import { useAuth } from '../../context/AuthContext';
import { Gamepad2, ArrowRight, X, Play } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [players, setPlayers] = useState<RosterPlayer[]>([]);
  const [arcadeGames, setArcadeGames] = useState<ArcadeGame[]>([]);

  // Arcade theater state
  const [playingGame, setPlayingGame] = useState<{ title: string; url: string } | null>(null);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadGenre, setUploadGenre] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadAuthor, setUploadAuthor] = useState('');
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    const unsubRoster = subscribeToRoster(setPlayers);
    const unsubArcade = subscribeToArcadeGames(setArcadeGames);
    return () => {
      unsubRoster();
      unsubArcade();
    };
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    try {
      await addArcadeGame({
        title: uploadTitle,
        genre: uploadGenre || 'Arcade',
        desc: uploadDesc,
        url: uploadUrl,
        author: uploadAuthor || currentUser?.displayName || 'Anonymous'
      });
      setIsUploadOpen(false);
      setUploadTitle('');
      setUploadGenre('');
      setUploadDesc('');
      setUploadUrl('');
      setUploadAuthor('');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload arcade game.');
    }
  };

  const getGameTagStyle = (gameName: string) => {
    switch (gameName) {
      case 'Free Fire Max':
        return { color: '#c09020', borderColor: 'rgba(255,214,0,.2)' };
      case 'BGMI':
        return { color: '#c080e0', borderColor: 'rgba(224,64,251,.25)' };
      case 'Valorant':
        return { color: '#cc5060', borderColor: 'rgba(255,70,85,.25)' };
      case 'Mobile Legends':
        return { color: '#7abacc', borderColor: 'rgba(0,229,255,.2)' };
      default:
        return { color: '#00e5ff', borderColor: 'rgba(0,229,255,.25)' };
    }
  };

  return (
    <div>
      {/* HERO SECTION */}
      <section
        id="hero"
        style={{
          paddingTop: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 80% 60% at 50% 40%, #0d2a5522 0%, transparent 70%), radial-gradient(ellipse 40% 50% at 20% 80%, #00e5ff11 0%, transparent 50%)'
          }}
        />
        <ParticleBackground />

        <div style={{ position: 'relative', textAlign: 'center', zIndex: 2, padding: '0 20px', maxWidth: '860px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0, 229, 255, 0.08)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              borderRadius: '100px',
              padding: '6px 18px',
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--cyan)',
              marginBottom: '28px'
            }}
          >
            India's Elite Esports Organization
          </div>

          <h1
            style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: 'clamp(3rem, 8vw, 7rem)',
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: '0.05em',
              background: 'linear-gradient(135deg, #fff 0%, #a8d8f0 40%, var(--cyan) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}
          >
            HOSHIMA
          </h1>
          <p
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: 'clamp(1rem, 3vw, 1.6rem)',
              fontWeight: 600,
              letterSpacing: '0.5em',
              textTransform: 'uppercase',
              color: '#5b8db8',
              marginBottom: '24px'
            }}
          >
            Esports
          </p>
          <p
            style={{
              maxWidth: '540px',
              margin: '0 auto 44px',
              fontSize: '1.05rem',
              color: '#7a9ab5',
              lineHeight: 1.7,
              fontWeight: 300
            }}
          >
            Dominating the battlefield across Free Fire Max, BGMI, Valorant, and Mobile Legends. We don't just play — we
            redefine what's possible.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#games-section" className="btn-primary">
              Explore Games
            </a>
            <Link to="/teams" className="btn-outline">
              Meet the Team
            </Link>
          </div>
        </div>
      </section>

      {/* GAMES ARSENAL */}
      <section id="games-section" style={{ padding: '100px 40px 60px', maxWidth: '1280px', margin: '0 auto' }}>
        <div className="section-header">
          <p className="section-tag">Our Arsenal</p>
          <h2 className="section-title">
            FEATURED <span>GAMES</span>
          </h2>
          <div className="section-line" />
          <p
            style={{
              color: '#4a6a8a',
              fontSize: '0.9rem',
              marginTop: '16px',
              fontFamily: 'Rajdhani, sans-serif',
              letterSpacing: '0.08em'
            }}
          >
            Select any title to access dedicated scrims, strategies, and comms
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}
        >
          {Object.values(GAMES_DATA).map((game) => (
            <div
              key={game.id}
              onClick={() => navigate(`/game/${game.id}`)}
              style={{
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: '1px solid rgba(0,229,255,.08)',
                background: 'var(--dark3)',
                transition: 'all .3s cubic-bezier(.16,1,.3,1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = 'rgba(0,229,255,.4)';
                e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,.6), 0 0 20px rgba(0,229,255,.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'rgba(0,229,255,.08)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  height: '200px',
                  background: game.heroBg,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(0,0,0,.6)',
                    border: `1px solid ${game.badgeBorder}`,
                    color: game.badgeText,
                    borderRadius: '100px',
                    padding: '4px 12px',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase'
                  }}
                >
                  {game.badge}
                </span>
                <Gamepad2 size={64} color={game.accent} style={{ opacity: 0.8 }} />
              </div>

              <div style={{ padding: '24px' }}>
                <h3
                  style={{
                    fontFamily: 'Orbitron, monospace',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: '#fff',
                    marginBottom: '8px'
                  }}
                >
                  {game.name}
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#6a8aaa', lineHeight: 1.6, marginBottom: '20px' }}>
                  {game.subtitle}
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(255,255,255,.06)'
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontFamily: 'Rajdhani, sans-serif',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: 'var(--cyan)'
                      }}
                    >
                      {game.playersCount}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.7rem',
                        color: '#4a6a8a',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                      }}
                    >
                      Players
                    </span>
                  </div>
                  <div>
                    <span
                      style={{
                        fontFamily: 'Rajdhani, sans-serif',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: 'var(--cyan)'
                      }}
                    >
                      {game.titlesCount}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.7rem',
                        color: '#4a6a8a',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                      }}
                    >
                      Titles
                    </span>
                  </div>
                  <div>
                    <span
                      style={{
                        fontFamily: 'Rajdhani, sans-serif',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: 'var(--cyan)'
                      }}
                    >
                      {game.rankBadge}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.7rem',
                        color: '#4a6a8a',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                      }}
                    >
                      Tier
                    </span>
                  </div>
                </div>

                <button className="enter-btn">
                  Enter Hub <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ padding: '0 40px' }}>
        <div className="divider" />
      </div>

      {/* COMMUNITY ARCADE */}
      <section id="arcade-section" style={{ padding: '80px 40px', maxWidth: '1280px', margin: '0 auto' }}>
        <div className="section-header">
          <p className="section-tag">Play Instantly</p>
          <h2 className="section-title">
            COMMUNITY <span>ARCADE</span>
          </h2>
          <div className="section-line" />
          <p
            style={{
              color: '#4a6a8a',
              fontSize: '0.9rem',
              marginTop: '16px',
              fontFamily: 'Rajdhani, sans-serif',
              letterSpacing: '0.08em'
            }}
          >
            Play community web games or submit your own custom title
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px'
          }}
        >
          {arcadeGames.map((game) => (
            <div
              key={game.id}
              style={{
                backgroundColor: 'var(--dark3)',
                border: '1px solid rgba(0, 229, 255, 0.1)',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.3s'
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: 'Orbitron, monospace',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: '#fff',
                    marginBottom: '8px'
                  }}
                >
                  {game.title}
                </h3>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    fontFamily: 'Rajdhani, sans-serif',
                    color: 'var(--cyan)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '14px'
                  }}
                >
                  <span>By {game.author}</span>
                  <span>{game.genre}</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#7a9ab5', lineHeight: 1.5, marginBottom: '20px' }}>
                  {game.desc}
                </p>
              </div>

              <button
                onClick={() => setPlayingGame({ title: game.title, url: game.url })}
                className="btn-primary"
                style={{ width: '100%', padding: '11px', fontSize: '0.9rem' }}
              >
                <Play size={16} /> Play Now
              </button>
            </div>
          ))}

          {/* Upload Game Card */}
          <div
            onClick={() => setIsUploadOpen(true)}
            style={{
              background: 'rgba(0, 229, 255, 0.02)',
              border: '2px dashed rgba(0, 229, 255, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 229, 255, 0.05)';
              e.currentTarget.style.borderColor = 'var(--cyan)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 229, 255, 0.02)';
              e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.2)';
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '14px' }}>🕹️</div>
            <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.1rem', color: '#fff', marginBottom: '4px' }}>
              Upload Your Game
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#4a6a8a' }}>Share playable web game link with Hoshima</p>
          </div>
        </div>
      </section>

      {/* THE SQUAD PREVIEW */}
      <section style={{ padding: '80px 40px', maxWidth: '1280px', margin: '0 auto' }}>
        <div className="section-header">
          <p className="section-tag">Our Roster</p>
          <h2 className="section-title">
            THE <span>SQUAD</span>
          </h2>
          <div className="section-line" />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '20px'
          }}
        >
          {players.map((p) => (
            <div
              key={p.id}
              style={{
                backgroundColor: 'var(--dark3)',
                border: '1px solid rgba(255,255,255,.07)',
                borderRadius: '8px',
                padding: '24px 20px',
                textAlign: 'center',
                transition: 'all 0.3s'
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  margin: '0 auto 14px',
                  border: `2px solid ${p.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '1.3rem',
                  fontWeight: 900,
                  backgroundColor: 'var(--dark2)',
                  color: p.color
                }}
              >
                {p.name.substring(0, 2)}
              </div>
              <p
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: '#4a6a8a',
                  marginBottom: '4px'
                }}
              >
                {p.tag}
              </p>
              <h3
                style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: '4px'
                }}
              >
                {p.name}
              </h3>
              <p
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '0.82rem',
                  color: 'var(--cyan)',
                  fontWeight: 600,
                  marginBottom: '12px'
                }}
              >
                {p.role}
              </p>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '100px',
                  fontSize: '0.7rem',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  backgroundColor: 'rgba(0, 229, 255, 0.08)',
                  border: '1px solid',
                  ...getGameTagStyle(p.game)
                }}
              >
                {p.game}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT & LEGACY */}
      <section
        style={{
          padding: '80px 40px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(13,47,97,.1) 50%, transparent 100%)'
        }}
      >
        <div className="section-header">
          <p className="section-tag">Legacy</p>
          <h2 className="section-title">
            ABOUT <span>US</span>
          </h2>
          <div className="section-line" />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1px',
            maxWidth: '900px',
            margin: '0 auto',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.07)'
          }}
        >
          <div style={{ padding: '40px 24px', textAlign: 'center', backgroundColor: 'var(--dark3)' }}>
            <div
              style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '2.4rem',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #fff, var(--cyan))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '8px'
              }}
            >
              24
            </div>
            <div
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#4a6a8a'
              }}
            >
              Tournaments
            </div>
          </div>

          <div style={{ padding: '40px 24px', textAlign: 'center', backgroundColor: 'var(--dark3)' }}>
            <div
              style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '2.4rem',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #fff, var(--cyan))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '8px'
              }}
            >
              15
            </div>
            <div
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#4a6a8a'
              }}
            >
              Championships
            </div>
          </div>

          <div style={{ padding: '40px 24px', textAlign: 'center', backgroundColor: 'var(--dark3)' }}>
            <div
              style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '2.4rem',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #fff, var(--cyan))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '8px'
              }}
            >
              500K+
            </div>
            <div
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#4a6a8a'
              }}
            >
              Fans
            </div>
          </div>
        </div>
      </section>

      {/* THEATER OVERLAY */}
      {playingGame && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 7, 12, 0.95)',
            zIndex: 600,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              width: 'min(960px, 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px'
            }}
          >
            <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.3rem', color: '#fff', fontWeight: 700 }}>
              {playingGame.title}
            </h3>
            <button
              onClick={() => setPlayingGame(null)}
              style={{
                backgroundColor: 'rgba(255, 70, 85, 0.15)',
                border: '1px solid #ff4655',
                color: '#ff4655',
                padding: '8px 16px',
                borderRadius: '6px',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
          <div
            style={{
              width: 'min(960px, 100%)',
              height: 'min(540px, 80vh)',
              backgroundColor: '#000',
              border: '2px solid var(--cyan)',
              boxShadow: 'var(--glow-strong)',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          >
            <iframe
              src={playingGame.url}
              title={playingGame.title}
              style={{ width: '100%', height: '100%', border: 'none' }}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {isUploadOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}
            >
              <h3 style={{ fontFamily: 'Orbitron, monospace', color: '#fff', fontSize: '1.2rem' }}>
                Upload Arcade Game
              </h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                style={{ background: 'none', border: 'none', color: '#4a6a8a', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {uploadError && (
              <div
                style={{
                  background: 'rgba(255,70,85,.12)',
                  border: '1px solid rgba(255,70,85,.3)',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  color: '#ff6b7a',
                  marginBottom: '16px',
                  fontSize: '0.85rem'
                }}
              >
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '0.75rem',
                    color: '#4a6a8a',
                    marginBottom: '6px',
                    textTransform: 'uppercase'
                  }}
                >
                  Game Title *
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Laser Quest"
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
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '0.75rem',
                    color: '#4a6a8a',
                    marginBottom: '6px',
                    textTransform: 'uppercase'
                  }}
                >
                  Genre
                </label>
                <input
                  type="text"
                  value={uploadGenre}
                  onChange={(e) => setUploadGenre(e.target.value)}
                  placeholder="e.g. Platformer / Shooter"
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
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '0.75rem',
                    color: '#4a6a8a',
                    marginBottom: '6px',
                    textTransform: 'uppercase'
                  }}
                >
                  Description *
                </label>
                <textarea
                  required
                  rows={2}
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Brief synopsis of gameplay"
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
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '0.75rem',
                    color: '#4a6a8a',
                    marginBottom: '6px',
                    textTransform: 'uppercase'
                  }}
                >
                  Web Game URL *
                </label>
                <input
                  type="url"
                  required
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://..."
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

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="btn-outline"
                  style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
