import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { currentUser, userProfile, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const getRoleBadgeClass = () => {
    switch (role) {
      case 'admin':
        return 'role-badge-admin';
      case 'captain':
        return 'role-badge-captain';
      case 'member':
        return 'role-badge-member';
      case 'pending':
      default:
        return 'role-badge-pending';
    }
  };

  return (
    <nav className="hoshima-nav">
      <Link to="/" className="nav-logo">
        <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
          <path
            d="M38 40 C36 36 32 34 28 36 C22 38 20 46 24 52 C28 58 36 62 44 60 L50 58 L56 60 C64 62 72 58 76 52 C80 46 78 38 72 36 C68 34 64 36 62 40"
            stroke="#a8d8f0"
            strokeWidth="3"
            fill="none"
          />
          <ellipse cx="35" cy="44" rx="5" ry="6" fill="#a8d8f0" />
          <ellipse cx="65" cy="44" rx="5" ry="6" fill="#a8d8f0" />
          <ellipse cx="36" cy="43" rx="2.5" ry="3" fill="#0d47a1" />
          <ellipse cx="66" cy="43" rx="2.5" ry="3" fill="#0d47a1" />
          <path d="M40 32 C42 24 46 18 50 14 C54 18 58 24 60 32" stroke="#00e5ff" strokeWidth="2" fill="none" />
        </svg>
        <span className="nav-logo-text">HOSHIMA</span>
      </Link>

      <ul className="nav-links">
        <li>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Home
          </Link>
        </li>
        <li>
          <Link to="/teams" className={location.pathname === '/teams' ? 'active' : ''}>
            Teams
          </Link>
        </li>
        <li>
          <Link to="/achievements" className={location.pathname === '/achievements' ? 'active' : ''}>
            Achievements
          </Link>
        </li>
        <li>
          <Link to="/recruitment" className={location.pathname === '/recruitment' ? 'active' : ''}>
            Recruitment
          </Link>
        </li>

        {/* Role-Specific Navigation Links */}
        {role === 'admin' && (
          <li>
            <Link
              to="/admin"
              className={location.pathname.startsWith('/admin') ? 'active' : ''}
              style={{ color: '#ffd700', fontWeight: 700 }}
            >
              ADMIN
            </Link>
          </li>
        )}

        {role === 'captain' && (
          <li>
            <Link
              to="/captain"
              className={location.pathname === '/captain' ? 'active' : ''}
              style={{ color: '#c084fc', fontWeight: 700 }}
            >
              CAPTAIN
            </Link>
          </li>
        )}

        {(role === 'member' || role === 'captain' || role === 'admin') && (
          <li>
            <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
              Dashboard
            </Link>
          </li>
        )}

        {role === 'pending' && (
          <li>
            <Link
              to="/pending"
              className={location.pathname === '/pending' ? 'active' : ''}
              style={{ color: '#facc15' }}
            >
              Status: Pending
            </Link>
          </li>
        )}

        {/* Authentication State */}
        {currentUser ? (
          <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <div className="user-chip" title="View Profile">
                <div
                  className="chip-av"
                  style={{
                    backgroundColor: `${userProfile?.color || '#00e5ff'}22`,
                    color: userProfile?.color || '#00e5ff',
                    border: `1px solid ${userProfile?.color || '#00e5ff'}55`
                  }}
                >
                  {(userProfile?.displayName || currentUser.displayName || 'OP').substring(0, 2).toUpperCase()}
                </div>
                <span className="chip-name">
                  {userProfile?.gamingUsername || userProfile?.displayName || 'Player'}
                </span>
                <span className={getRoleBadgeClass()}>{role?.toUpperCase()}</span>
              </div>
            </Link>

            <button onClick={handleLogout} className="logout-btn" title="Sign Out">
              Logout
            </button>
          </li>
        ) : (
          <li>
            <Link to="/login" className="nav-cta">
              Sign In
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
};
