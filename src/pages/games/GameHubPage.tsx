import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GAMES_DATA } from '../../data/defaultGames';
import { useAuth } from '../../context/AuthContext';
import { subscribeToChannelMessages, sendChannelMessage } from '../../services/chatService';
import type { ChatMessage } from '../../types/roster';
import { ArrowLeft, Send, Users, Target, Lock } from 'lucide-react';

const CHANNELS = [
  { id: 'general', name: 'general', desc: 'General squad discussion' },
  { id: 'strat-talk', name: 'strat-talk', desc: 'Tactical setups and callouts' },
  { id: 'scrim-lobby', name: 'scrim-lobby', desc: 'Lobby credentials & match timing' },
  { id: 'highlights', name: 'highlights', desc: 'Clutch clips and debriefs' }
];

export const GameHubPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const game = (gameId && GAMES_DATA[gameId]) || GAMES_DATA.ff;

  const { currentUser, userProfile, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'scrims' | 'strats' | 'plan' | 'chat'>('scrims');

  // Chat State
  const [currentChannel, setCurrentChannel] = useState('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const isMemberOrAbove = role === 'member' || role === 'captain' || role === 'admin';

  useEffect(() => {
    // Only subscribe to private chat channels if user has approved member clearance
    if (!isMemberOrAbove) {
      setMessages([]);
      return;
    }

    const unsub = subscribeToChannelMessages(game.id, currentChannel, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);
    });
    return () => unsub();
  }, [game.id, currentChannel, isMemberOrAbove]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentUser) return;

    try {
      await sendChannelMessage(game.id, currentChannel, {
        name: userProfile?.gamingUsername || userProfile?.displayName || 'Operative',
        avatar: (userProfile?.gamingUsername || 'OP').substring(0, 2).toUpperCase(),
        color: userProfile?.color || '#00e5ff',
        text: chatInput,
        uid: currentUser.uid
      });
      setChatInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div style={{ paddingTop: '72px', minHeight: '100vh' }}>
      {/* Game Page Hero */}
      <div
        style={{
          position: 'relative',
          padding: '60px 40px 30px',
          borderBottom: '1px solid rgba(0,229,255,.1)',
          background: game.heroBg
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 600,
              fontSize: '0.85rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#4a6a8a',
              textDecoration: 'none',
              marginBottom: '24px'
            }}
          >
            <ArrowLeft size={16} /> Back to Hub
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
            <div>
              <h1
                style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: 'clamp(2rem, 5vw, 3.2rem)',
                  fontWeight: 900,
                  color: '#fff',
                  lineHeight: 1
                }}
              >
                {game.name}
              </h1>
              <p
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '1rem',
                  color: '#5a8aaa',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  marginTop: '8px'
                }}
              >
                {game.subtitle}
              </p>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 14px',
                  borderRadius: '100px',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  marginTop: '12px',
                  backgroundColor: game.badgeColor,
                  color: game.badgeText,
                  border: `1px solid ${game.badgeBorder}`
                }}
              >
                {game.badge}
              </span>
            </div>
          </div>

          {/* Hub Tab Switcher */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              background: 'rgba(0,0,0,.4)',
              borderRadius: '8px',
              padding: '4px',
              width: 'fit-content',
              border: '1px solid rgba(255,255,255,.07)',
              flexWrap: 'wrap'
            }}
          >
            {[
              { id: 'scrims', label: 'Scrims & Matches' },
              { id: 'strats', label: 'Strategy Board' },
              { id: 'plan', label: 'Game Plan' },
              { id: 'chat', label: 'Comms Hub' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: activeTab === t.id ? '#fff' : '#5a7a9a',
                  background:
                    activeTab === t.id ? 'linear-gradient(135deg,rgba(21,101,192,.7),rgba(2,136,209,.7))' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: activeTab === t.id ? '0 2px 12px rgba(2,136,209,.4)' : 'none',
                  transition: 'all .2s'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hub Tab Panels */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 40px' }}>
        {/* TAB 1: SCRIMS */}
        {activeTab === 'scrims' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.4rem', color: '#fff', marginBottom: '6px' }}>
                  Upcoming Scrimmage Sessions
                </h2>
                <p style={{ color: '#5a7a9a' }}>
                  Live team scrimmage timetable. Match coordination, lobby passwords, and check-ins are organized inside <strong style={{ color: 'var(--cyan)' }}>#scrim-lobby</strong>.
                </p>
              </div>
              <button
                onClick={() => {
                  setCurrentChannel('scrim-lobby');
                  setActiveTab('chat');
                }}
                className="btn-outline"
                style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                Open #scrim-lobby Comms →
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px'
              }}
            >
              {game.scrims.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--dark3)',
                    border: '1px solid rgba(255,255,255,.07)',
                    borderRadius: '8px',
                    padding: '24px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1.15rem', color: '#fff' }}>
                      {s.title}
                    </h3>
                    <span
                      style={{
                        fontFamily: 'Rajdhani, sans-serif',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: s.status === 'open' ? '#4ade80' : s.status === 'full' ? '#ff4655' : '#facc15'
                      }}
                    >
                      ● {s.status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#4a6a8a', textTransform: 'uppercase' }}>Time</span>
                      <p style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, color: 'var(--silver)' }}>{s.time}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#4a6a8a', textTransform: 'uppercase' }}>Format</span>
                      <p style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, color: 'var(--silver)' }}>{s.format}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#4a6a8a', textTransform: 'uppercase' }}>Availability</span>
                      <p style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, color: 'var(--silver)' }}>{s.spots}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#4a6a8a', textTransform: 'uppercase' }}>Status</span>
                      <p style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, color: 'var(--silver)' }}>{s.status}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentChannel('scrim-lobby');
                      setActiveTab('chat');
                    }}
                    className="btn-outline"
                    style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
                  >
                    {s.status === 'full' ? 'Lobby Full — Open #scrim-lobby' : 'Join Coordination in #scrim-lobby →'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: STRATEGY BOARD */}
        {activeTab === 'strats' && (
          <div>
            <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.4rem', color: '#fff', marginBottom: '6px' }}>
              Tactical Strategy Board
            </h2>
            <p style={{ color: '#5a7a9a', marginBottom: '32px' }}>Review offensive rotations and site setups.</p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px'
              }}
            >
              {game.strategies.map((strat, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--dark3)',
                    border: '1px solid rgba(255,255,255,.07)',
                    borderRadius: '8px',
                    padding: '24px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span
                      style={{
                        fontFamily: 'Rajdhani, sans-serif',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '3px 10px',
                        borderRadius: '100px',
                        background: 'rgba(0, 229, 255, 0.08)',
                        color: 'var(--cyan)',
                        border: '1px solid rgba(0, 229, 255, 0.2)'
                      }}
                    >
                      {strat.category}
                    </span>
                    <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.8rem', color: '#4a6a8a' }}>
                      ♥ {strat.likes}
                    </span>
                  </div>

                  <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#fff', marginBottom: '8px' }}>
                    {strat.title}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#7a9ab5', lineHeight: 1.6, marginBottom: '16px' }}>
                    {strat.desc}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#3a5a7a', fontFamily: 'Rajdhani, sans-serif' }}>
                    Author: <span style={{ color: '#8ca0b8' }}>{strat.author}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: GAME PLAN */}
        {activeTab === 'plan' && (
          <div>
            <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.4rem', color: '#fff', marginBottom: '6px' }}>
              Execution Blueprint
            </h2>
            <p style={{ color: '#5a7a9a', marginBottom: '32px' }}>Roles, phase timeline, and callout coordinates.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* Roles */}
              <div style={{ backgroundColor: 'var(--dark3)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '8px', padding: '28px' }}>
                <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1rem', color: '#fff', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users size={18} color="var(--cyan)" /> Assigned Squad Roles
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {game.roles.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        backgroundColor: 'rgba(255,255,255,.03)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,.05)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: r.color }} />
                        <div>
                          <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{r.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#5a7a9a' }}>{r.player}</div>
                        </div>
                      </div>
                      <span style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--cyan)', fontSize: '0.75rem', fontWeight: 600 }}>
                        {r.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Objectives */}
              <div style={{ backgroundColor: 'var(--dark3)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '8px', padding: '28px' }}>
                <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1rem', color: '#fff', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Target size={18} color="var(--cyan)" /> Win Condition Directives
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {game.objectives.map((obj, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '14px',
                        backgroundColor: 'rgba(255,255,255,.03)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,.05)',
                        fontSize: '0.88rem',
                        color: '#8ca0b8',
                        lineHeight: 1.5
                      }}
                    >
                      <strong style={{ color: '#fff', marginRight: '6px' }}>0{i + 1}.</strong>
                      {obj.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COMMS HUB */}
        {activeTab === 'chat' && (
          <div>
            <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.4rem', color: '#fff', marginBottom: '6px' }}>
              Squad Communications Hub
            </h2>
            <p style={{ color: '#5a7a9a', marginBottom: '24px' }}>Real-time coordination channel powered by Cloud Firestore.</p>

            <div
              className="comms-container"
              style={{
                display: 'grid',
                gridTemplateColumns: '240px 1fr',
                gap: '20px',
                height: '560px',
                backgroundColor: 'var(--dark3)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,.07)',
                overflow: 'hidden'
              }}
            >
              {/* Channel List */}
              <div
                className="comms-channels"
                style={{ backgroundColor: 'var(--dark2)', padding: '16px', borderRight: '1px solid rgba(255,255,255,.06)' }}
              >
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4a6a8a', marginBottom: '12px' }}>
                  Channels
                </div>
                {CHANNELS.map((ch) => (
                  <div
                    key={ch.id}
                    onClick={() => setCurrentChannel(ch.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: currentChannel === ch.id ? 'var(--cyan)' : '#7a9ab5',
                      backgroundColor: currentChannel === ch.id ? 'rgba(0, 229, 255, 0.08)' : 'transparent',
                      marginBottom: '4px',
                      transition: 'all .2s'
                    }}
                  >
                    # {ch.name}
                  </div>
                ))}
              </div>

              {/* Chat Viewport */}
              <div className="comms-viewport" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Header */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>
                    # {currentChannel}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#5a7a9a' }}>
                    {CHANNELS.find((c) => c.id === currentChannel)?.desc}
                  </span>
                </div>

                {/* Messages scroll */}
                <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {!isMemberOrAbove ? (
                    <div style={{ textAlign: 'center', margin: 'auto', maxWidth: '380px', padding: '24px 16px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'rgba(0, 229, 255, 0.08)',
                          border: '1px solid rgba(0, 229, 255, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px'
                        }}
                      >
                        <Lock size={22} color="var(--cyan)" />
                      </div>
                      <h4 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1rem', color: '#fff', marginBottom: '8px' }}>
                        RESTRICTED FREQUENCY
                      </h4>
                      <p style={{ color: '#7a9ab5', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '20px' }}>
                        This channel is encrypted for approved Hoshima operatives. Sign in with an authorized member profile to view transmissions and collaborate with the squad.
                      </p>
                      {!currentUser ? (
                        <Link
                          to="/login"
                          className="btn-primary"
                          style={{ display: 'inline-flex', padding: '8px 22px', fontSize: '0.85rem', textDecoration: 'none' }}
                        >
                          Sign In with Google
                        </Link>
                      ) : (
                        <Link
                          to="/pending"
                          className="btn-primary"
                          style={{ display: 'inline-flex', padding: '8px 22px', fontSize: '0.85rem', textDecoration: 'none' }}
                        >
                          View Application Status
                        </Link>
                      )}
                    </div>
                  ) : messages.length === 0 ? (
                    <p style={{ color: '#3a5a7a', fontSize: '0.88rem', margin: 'auto' }}>No messages yet in #{currentChannel}.</p>
                  ) : (
                    messages.map((m, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: `${m.color}22`,
                            color: m.color,
                            border: `1px solid ${m.color}44`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'Orbitron, monospace',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            flexShrink: 0
                          }}
                        >
                          {m.avatar}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: m.color }}>
                              {m.name}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#4a6a8a' }}>{m.time}</span>
                          </div>
                          <p style={{ fontSize: '0.9rem', color: '#e0e8f0', lineHeight: 1.4 }}>{m.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input row */}
                <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
                  {!currentUser ? (
                    <div style={{ fontSize: '0.85rem', color: '#5a7a9a', textAlign: 'center' }}>
                      <Link to="/login" style={{ color: 'var(--cyan)' }}>
                        Sign in
                      </Link>{' '}
                      to broadcast messages to #{currentChannel}
                    </div>
                  ) : !isMemberOrAbove ? (
                    <div style={{ fontSize: '0.85rem', color: '#facc15', textAlign: 'center' }}>
                      Pending review: Comms hub broadcasting unlocks once your application is approved.
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder={`Message #${currentChannel}...`}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        style={{
                          flex: 1,
                          background: 'rgba(255,255,255,.05)',
                          border: '1px solid rgba(255,255,255,.1)',
                          borderRadius: '6px',
                          padding: '10px 16px',
                          color: '#fff',
                          outline: 'none',
                          fontSize: '0.9rem'
                        }}
                      />
                      <button type="submit" className="btn-primary" style={{ padding: '10px 18px' }}>
                        <Send size={16} />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
