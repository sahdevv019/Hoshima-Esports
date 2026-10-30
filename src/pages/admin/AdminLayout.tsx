import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Shield, FileCheck, Users, BarChart3 } from 'lucide-react';

export const AdminLayout: React.FC = () => {
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
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Shield size={18} color="#ffd700" />
          <span
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#ffd700'
            }}
          >
            Security Level: Administrator
          </span>
        </div>
        <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '2.2rem', fontWeight: 900, color: '#fff' }}>
          ADMINISTRATION CONSOLE
        </h1>
        <p style={{ color: '#7a9ab5' }}>
          Full authority over operative applications, squad captain assignments, and organization roster.
        </p>
      </div>

      {/* Admin Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '6px',
          width: 'fit-content',
          marginBottom: '36px'
        }}
      >
        <NavLink
          to="/admin"
          end
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '6px',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            fontSize: '0.9rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            color: isActive ? '#fff' : '#7a9ab5',
            background: isActive ? 'linear-gradient(135deg, #1565c0, #0288d1)' : 'transparent',
            boxShadow: isActive ? 'var(--glow)' : 'none',
            transition: 'all .2s'
          })}
        >
          <BarChart3 size={16} /> Overview
        </NavLink>

        <NavLink
          to="/admin/applications"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '6px',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            fontSize: '0.9rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            color: isActive ? '#fff' : '#7a9ab5',
            background: isActive ? 'linear-gradient(135deg, #1565c0, #0288d1)' : 'transparent',
            boxShadow: isActive ? 'var(--glow)' : 'none',
            transition: 'all .2s'
          })}
        >
          <FileCheck size={16} /> Applications
        </NavLink>

        <NavLink
          to="/admin/members"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '6px',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            fontSize: '0.9rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            color: isActive ? '#fff' : '#7a9ab5',
            background: isActive ? 'linear-gradient(135deg, #1565c0, #0288d1)' : 'transparent',
            boxShadow: isActive ? 'var(--glow)' : 'none',
            transition: 'all .2s'
          })}
        >
          <Users size={16} /> Member Directory
        </NavLink>
      </div>

      <Outlet />
    </div>
  );
};
