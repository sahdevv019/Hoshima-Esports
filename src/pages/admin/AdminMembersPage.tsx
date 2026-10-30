import React, { useState, useEffect } from 'react';
import { subscribeToAllUsers, assignCaptainRole, revokeCaptainRole, changeUserRole } from '../../services/memberService';
import { useAuth } from '../../context/AuthContext';
import type { UserProfile, UserRole } from '../../types/auth';
import { Search } from 'lucide-react';

const SQUADS = ['Free Fire Max', 'BGMI', 'Valorant', 'Mobile Legends'];

export const AdminMembersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedSquadForCaptain, setSelectedSquadForCaptain] = useState<Record<string, string>>({});
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToAllUsers(setUsers);
    return () => unsub();
  }, []);

  const handleAssignCaptain = async (targetUid: string) => {
    if (!currentUser) return;
    const squad = selectedSquadForCaptain[targetUid] || 'Free Fire Max';
    if (window.confirm(`Promote this member to Captain of ${squad}?`)) {
      setLoadingAction(targetUid);
      try {
        await assignCaptainRole(targetUid, squad, currentUser.uid);
      } catch (err: any) {
        alert(err.message || 'Failed to assign Captain role.');
      } finally {
        setLoadingAction(null);
      }
    }
  };

  const handleRevokeCaptain = async (targetUid: string) => {
    if (window.confirm('Revoke Captain privileges and revert user to regular Member?')) {
      setLoadingAction(targetUid);
      try {
        await revokeCaptainRole(targetUid);
      } catch (err: any) {
        alert(err.message || 'Failed to revoke Captain role.');
      } finally {
        setLoadingAction(null);
      }
    }
  };

  const handleRoleChange = async (targetUid: string, newRole: UserRole) => {
    if (!currentUser) return;
    if (window.confirm(`Change this operative's role to ${newRole.toUpperCase()}?`)) {
      setLoadingAction(targetUid);
      try {
        await changeUserRole(targetUid, newRole, currentUser.uid);
      } catch (err: any) {
        alert(err.message || 'Role modification rejected.');
      } finally {
        setLoadingAction(null);
      }
    }
  };

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch =
      !search ||
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.gamingUsername?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div style={{ background: 'var(--dark2)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', padding: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.25rem', color: '#fff' }}>
            Operative Directory ({filtered.length})
          </h2>
          <p style={{ color: '#5a7a9a', fontSize: '0.85rem' }}>Full management of roles, squad captaincy, and credentials</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by name, IGN, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: '6px',
                padding: '8px 14px 8px 34px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                width: '240px'
              }}
            />
            <Search size={16} color="#4a6a8a" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              background: 'var(--dark)',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: '6px',
              padding: '8px 14px',
              color: '#8ca0b8',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="captain">Captains</option>
            <option value="member">Members</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>Operative</th>
              <th style={{ textAlign: 'left', padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>Primary Game</th>
              <th style={{ textAlign: 'left', padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>Role Assignment</th>
              <th style={{ textAlign: 'left', padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>Captaincy Scope</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const isSelf = currentUser && u.uid === currentUser.uid;

              return (
                <tr key={u.uid} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: `${u.color || '#00e5ff'}22`,
                          color: u.color || '#00e5ff',
                          border: `1px solid ${u.color || '#00e5ff'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontFamily: 'Orbitron, monospace',
                          fontWeight: 700
                        }}
                      >
                        {u.displayName?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: '#fff', fontWeight: 600 }}>
                          {u.displayName} {isSelf && <span style={{ color: '#ffd700', fontSize: '0.7rem' }}>(You)</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#5a7a9a' }}>
                          IGN: {u.gamingUsername} • {u.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '14px 12px', color: 'var(--cyan)' }}>{u.preferredGame || 'N/A'}</td>

                  <td style={{ padding: '14px 12px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: u.status === 'approved' ? 'rgba(74,222,128,.1)' : 'rgba(250,204,21,.1)',
                        color: u.status === 'approved' ? '#4ade80' : '#facc15'
                      }}
                    >
                      {u.status}
                    </span>
                  </td>

                  <td style={{ padding: '14px 12px' }}>
                    {isSelf ? (
                      <span className="role-badge-admin">ADMIN (IMMUTABLE)</span>
                    ) : (
                      <select
                        value={u.role}
                        disabled={loadingAction === u.uid}
                        onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                        style={{
                          background: 'var(--dark)',
                          border: '1px solid rgba(255,255,255,.1)',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          color: '#fff',
                          fontSize: '0.8rem',
                          fontFamily: 'Rajdhani, sans-serif',
                          fontWeight: 600,
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="member">Member</option>
                        <option value="captain">Captain</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>

                  <td style={{ padding: '14px 12px' }}>
                    {u.role === 'captain' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#c084fc', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                          {u.assignedSquad || 'Squad'} Captain
                        </span>
                        <button
                          onClick={() => handleRevokeCaptain(u.uid)}
                          disabled={loadingAction === u.uid}
                          style={{
                            background: 'rgba(255,70,85,.1)',
                            border: '1px solid rgba(255,70,85,.3)',
                            color: '#ff4655',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.7rem'
                          }}
                        >
                          Revoke
                        </button>
                      </div>
                    ) : u.role === 'member' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                          value={selectedSquadForCaptain[u.uid] || u.preferredGame || 'Free Fire Max'}
                          onChange={(e) =>
                            setSelectedSquadForCaptain({ ...selectedSquadForCaptain, [u.uid]: e.target.value })
                          }
                          style={{
                            background: 'var(--dark)',
                            border: '1px solid rgba(255,255,255,.1)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            color: '#8ca0b8',
                            fontSize: '0.75rem',
                            outline: 'none'
                          }}
                        >
                          {SQUADS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssignCaptain(u.uid)}
                          disabled={loadingAction === u.uid}
                          style={{
                            background: 'rgba(168,85,247,.1)',
                            border: '1px solid rgba(168,85,247,.3)',
                            color: '#c084fc',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            fontWeight: 600
                          }}
                        >
                          Make Captain
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: '#4a6a8a', fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
