import React, { useState, useEffect } from 'react';
import {
  subscribeToAllUsers,
  assignCaptainRole,
  revokeCaptainRole,
  changeUserRole
} from '../../services/memberService';
import { approveApplication } from '../../services/applicationService';
import { useAuth } from '../../context/AuthContext';
import type { UserProfile, UserRole } from '../../types/auth';
import { Search, CheckCircle, AlertCircle, X, Shield, Users, Crown, Check } from 'lucide-react';

const SQUADS = ['Free Fire Max', 'BGMI', 'Valorant', 'Mobile Legends'];

interface ConfirmationModalState {
  isOpen: boolean;
  title: string;
  message: string;
  warning?: string;
  confirmLabel: string;
  isDestructive?: boolean;
  onConfirm: () => Promise<void>;
}

export const AdminMembersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSquadForCaptain, setSelectedSquadForCaptain] = useState<Record<string, string>>({});
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Modal & Toast states
  const [confirmModal, setConfirmModal] = useState<ConfirmationModalState | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const unsub = subscribeToAllUsers((u) => {
      setUsers(u);
      setLoadingUsers(false);
    });
    return () => unsub();
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  // --- ACTIONS WITH CONFIRMATION DIALOGS ---

  const requestApproveApplication = (u: UserProfile) => {
    if (!currentUser) return;
    setConfirmModal({
      isOpen: true,
      title: 'Approve Recruitment Application',
      message: `Authorize ${u.displayName} (${u.gamingUsername || 'Player'}) for full organization membership?`,
      warning: 'This will atomically grant the MEMBER role and mark the account status as APPROVED in Firestore.',
      confirmLabel: 'Confirm Approval',
      isDestructive: false,
      onConfirm: async () => {
        setLoadingAction(u.uid);
        try {
          await approveApplication(u.uid, currentUser.uid);
          showToast('success', `${u.displayName} has been approved as an active Member.`);
        } catch (err: any) {
          showToast('error', err.message || 'Approval failed.');
        } finally {
          setLoadingAction(null);
          setConfirmModal(null);
        }
      }
    });
  };

  const requestAssignCaptain = (u: UserProfile) => {
    if (!currentUser) return;
    const squad = selectedSquadForCaptain[u.uid] || u.preferredGame || 'Free Fire Max';

    if (u.status !== 'approved') {
      showToast('error', 'Invalid Action: Only approved members can be appointed as Captain.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Appoint Squad Captain',
      message: `Promote ${u.displayName} (${u.gamingUsername || 'Player'}) to Captain of the ${squad} division?`,
      warning: `This user will receive roster editing and scrimmage coordination authority strictly for the ${squad} squad.`,
      confirmLabel: `Appoint ${squad} Captain`,
      isDestructive: false,
      onConfirm: async () => {
        setLoadingAction(u.uid);
        try {
          await assignCaptainRole(u.uid, squad, currentUser.uid);
          showToast('success', `${u.displayName} is now Captain of ${squad}.`);
        } catch (err: any) {
          showToast('error', err.message || 'Failed to assign Captain.');
        } finally {
          setLoadingAction(null);
          setConfirmModal(null);
        }
      }
    });
  };

  const requestRevokeCaptain = (u: UserProfile) => {
    setConfirmModal({
      isOpen: true,
      title: 'Revoke Captain Privileges',
      message: `Revoke Captain clearance from ${u.displayName}? The user will revert to a standard approved Member.`,
      confirmLabel: 'Revoke Captaincy',
      isDestructive: true,
      onConfirm: async () => {
        setLoadingAction(u.uid);
        try {
          await revokeCaptainRole(u.uid);
          showToast('success', `Captaincy revoked for ${u.displayName}.`);
        } catch (err: any) {
          showToast('error', err.message || 'Failed to revoke Captain role.');
        } finally {
          setLoadingAction(null);
          setConfirmModal(null);
        }
      }
    });
  };

  const requestRoleChange = (u: UserProfile, newRole: UserRole) => {
    if (!currentUser) return;

    if (newRole === 'admin') {
      setConfirmModal({
        isOpen: true,
        title: 'Promote to Organization Administrator',
        message: `Grant full administrative authority to ${u.displayName} (${u.email})?`,
        warning:
          'CRITICAL: Administrators hold unrestricted organization access, can approve/reject dossiers, and manage security credentials. In accordance with system security invariants, client-side admin demotion is locked once granted.',
        confirmLabel: 'Promote to Admin',
        isDestructive: false,
        onConfirm: async () => {
          setLoadingAction(u.uid);
          try {
            await changeUserRole(u.uid, newRole, currentUser.uid);
            showToast('success', `${u.displayName} has been promoted to Administrator.`);
          } catch (err: any) {
            showToast('error', err.message || 'Role promotion failed.');
          } finally {
            setLoadingAction(null);
            setConfirmModal(null);
          }
        }
      });
      return;
    }

    if (newRole === 'captain') {
      requestAssignCaptain(u);
      return;
    }

    // Changing between Member / Pending
    setConfirmModal({
      isOpen: true,
      title: `Update Operative Role`,
      message: `Change ${u.displayName}'s role to ${newRole.toUpperCase()}?`,
      confirmLabel: 'Apply Role Change',
      isDestructive: newRole === 'pending',
      onConfirm: async () => {
        setLoadingAction(u.uid);
        try {
          await changeUserRole(u.uid, newRole, currentUser.uid);
          showToast('success', `Role updated to ${newRole.toUpperCase()} for ${u.displayName}.`);
        } catch (err: any) {
          showToast('error', err.message || 'Role modification rejected.');
        } finally {
          setLoadingAction(null);
          setConfirmModal(null);
        }
      }
    });
  };

  // --- FILTERING ---
  const filtered = users.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      u.displayName?.toLowerCase().includes(q) ||
      u.gamingUsername?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.preferredGame?.toLowerCase().includes(q);
    return matchRole && matchStatus && matchSearch;
  });

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  return (
    <div style={{ background: 'var(--dark2)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', padding: '28px', position: 'relative' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '84px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 20px',
            borderRadius: '8px',
            backgroundColor: toast.type === 'success' ? '#0d2818' : '#2d0a0e',
            border: `1px solid ${toast.type === 'success' ? '#22c55e' : '#ef4444'}`,
            color: toast.type === 'success' ? '#86efac' : '#fca5a5',
            boxShadow: '0 12px 32px rgba(0,0,0,0.8)',
            maxWidth: '420px',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 600,
            fontSize: '0.92rem'
          }}
        >
          {toast.type === 'success' ? <CheckCircle size={20} color="#22c55e" /> : <AlertCircle size={20} color="#ef4444" />}
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', color: '#8ca0b8', cursor: 'pointer', padding: '2px' }}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={22} color="var(--cyan)" /> Operative Directory ({filtered.length} of {users.length})
          </h2>
          <p style={{ color: '#5a7a9a', fontSize: '0.85rem' }}>
            Organizational hierarchy, squad captaincy scope, and credential governance
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              aria-label="Search operatives"
              placeholder="Search name, IGN, email, game..."
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
                width: '260px'
              }}
            />
            <Search size={16} color="#4a6a8a" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          </div>

          <select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              background: 'var(--dark)',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: '6px',
              padding: '8px 12px',
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

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: 'var(--dark)',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#8ca0b8',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Review</option>
            <option value="rejected">Rejected</option>
          </select>

          {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={clearFilters}
              className="btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loadingUsers ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#5a7a9a' }}>
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
            SCANNING OPERATIVE DIRECTORY...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
          <AlertCircle size={36} color="#4a6a8a" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.1rem', color: '#fff', marginBottom: '8px' }}>
            No Operatives Found
          </h3>
          <p style={{ color: '#5a7a9a', fontSize: '0.88rem', marginBottom: '16px' }}>
            {search ? `No records matched query "${search}".` : 'No operative profiles match the selected role/status criteria.'}
          </p>
          <button onClick={clearFilters} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
            Clear Search & Filters
          </button>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW (Screens >= 768px) */}
          <div className="desktop-table-container table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>Operative</th>
                  <th style={{ padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>Game Division</th>
                  <th style={{ padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>Approval Status</th>
                  <th style={{ padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>Role Assignment</th>
                  <th style={{ padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>Captaincy Scope</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isSelf = currentUser && u.uid === currentUser.uid;
                  const isApproved = u.status === 'approved';
                  const isPending = u.status === 'pending';

                  return (
                    <tr key={u.uid} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      {/* Operative Bio / Identity */}
                      <td style={{ padding: '14px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              backgroundColor: `${u.color || '#00e5ff'}22`,
                              color: u.color || '#00e5ff',
                              border: `1px solid ${u.color || '#00e5ff'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontFamily: 'Orbitron, monospace',
                              fontWeight: 700,
                              flexShrink: 0
                            }}
                          >
                            {(u.displayName || 'OP').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.92rem' }}>
                              {u.displayName} {isSelf && <span style={{ color: '#ffd700', fontSize: '0.72rem', fontWeight: 700 }}>(You)</span>}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#5a7a9a' }}>
                              IGN: <strong style={{ color: '#8ca0b8' }}>{u.gamingUsername || 'N/A'}</strong> • {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Primary Game */}
                      <td style={{ padding: '14px 12px', color: 'var(--cyan)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                        {u.preferredGame || 'Unassigned'}
                      </td>

                      {/* Approval Status */}
                      <td style={{ padding: '14px 12px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 9px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background:
                              u.status === 'approved'
                                ? 'rgba(74,222,128,.1)'
                                : u.status === 'rejected'
                                ? 'rgba(255,70,85,.1)'
                                : 'rgba(250,204,21,.1)',
                            color:
                              u.status === 'approved'
                                ? '#4ade80'
                                : u.status === 'rejected'
                                ? '#ff4655'
                                : '#facc15'
                          }}
                        >
                          ● {u.status || 'pending'}
                        </span>
                      </td>

                      {/* Role Management */}
                      <td style={{ padding: '14px 12px' }}>
                        {u.role === 'admin' ? (
                          <span className="role-badge-admin" title="Admin accounts are protected against client-side demotion">
                            <Crown size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                            ADMIN {isSelf ? '(YOU)' : '(PROTECTED)'}
                          </span>
                        ) : isPending ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="role-badge-pending">PENDING</span>
                            <button
                              onClick={() => requestApproveApplication(u)}
                              disabled={loadingAction === u.uid}
                              style={{
                                background: 'rgba(74,222,128,.12)',
                                border: '1px solid rgba(74,222,128,.35)',
                                color: '#4ade80',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.72rem',
                                fontFamily: 'Rajdhani, sans-serif',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Approve operative recruitment application"
                            >
                              <Check size={12} /> Approve
                            </button>
                          </div>
                        ) : (
                          <select
                            value={u.role}
                            disabled={loadingAction === u.uid}
                            onChange={(e) => requestRoleChange(u, e.target.value as UserRole)}
                            aria-label={`Change role for ${u.displayName}`}
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
                            <option value="member">Member</option>
                            <option value="captain">Captain</option>
                            <option value="admin">Promote to Admin</option>
                            <option value="pending">Revert to Pending</option>
                          </select>
                        )}
                      </td>

                      {/* Captain Scope & Assignment */}
                      <td style={{ padding: '14px 12px' }}>
                        {u.role === 'captain' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.8rem', color: '#c084fc', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                              {u.assignedSquad || 'Squad'} Captain
                            </span>
                            <button
                              onClick={() => requestRevokeCaptain(u)}
                              disabled={loadingAction === u.uid}
                              style={{
                                background: 'rgba(255,70,85,.1)',
                                border: '1px solid rgba(255,70,85,.3)',
                                color: '#ff4655',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                fontWeight: 600
                              }}
                            >
                              Revoke
                            </button>
                          </div>
                        ) : u.role === 'member' && isApproved ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <select
                              value={selectedSquadForCaptain[u.uid] || u.preferredGame || 'Free Fire Max'}
                              onChange={(e) =>
                                setSelectedSquadForCaptain({ ...selectedSquadForCaptain, [u.uid]: e.target.value })
                              }
                              aria-label={`Select squad for ${u.displayName}`}
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
                              onClick={() => requestAssignCaptain(u)}
                              disabled={loadingAction === u.uid}
                              style={{
                                background: 'rgba(168,85,247,.1)',
                                border: '1px solid rgba(168,85,247,.3)',
                                color: '#c084fc',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textTransform: 'uppercase'
                              }}
                            >
                              Make Captain
                            </button>
                          </div>
                        ) : isPending ? (
                          <span style={{ color: '#4a6a8a', fontSize: '0.78rem' }} title="Operatives must be approved members before Captaincy can be granted">
                            Requires Member Approval
                          </span>
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

          {/* MOBILE RESPONSIVE CARDS (Screens < 768px) */}
          <div className="mobile-cards-container" style={{ display: 'none', flexDirection: 'column', gap: '14px' }}>
            {filtered.map((u) => {
              const isSelf = currentUser && u.uid === currentUser.uid;
              const isApproved = u.status === 'approved';
              const isPending = u.status === 'pending';

              return (
                <div
                  key={u.uid}
                  style={{
                    backgroundColor: 'var(--dark3)',
                    border: '1px solid rgba(255,255,255,.07)',
                    borderRadius: '8px',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
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
                        {(u.displayName || 'OP').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                          {u.displayName} {isSelf && <span style={{ color: '#ffd700', fontSize: '0.7rem' }}>(You)</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#5a7a9a' }}>{u.email}</div>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background:
                          u.status === 'approved'
                            ? 'rgba(74,222,128,.1)'
                            : u.status === 'rejected'
                            ? 'rgba(255,70,85,.1)'
                            : 'rgba(250,204,21,.1)',
                        color:
                          u.status === 'approved'
                            ? '#4ade80'
                            : u.status === 'rejected'
                            ? '#ff4655'
                            : '#facc15'
                      }}
                    >
                      ● {u.status || 'pending'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', marginBottom: '14px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                    <div>
                      <span style={{ color: '#4a6a8a', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>IGN</span>
                      <strong style={{ color: 'var(--silver)' }}>{u.gamingUsername || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#4a6a8a', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Division</span>
                      <strong style={{ color: 'var(--cyan)' }}>{u.preferredGame || 'Unassigned'}</strong>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      {u.role === 'admin' ? (
                        <span className="role-badge-admin">ADMIN (LOCKED)</span>
                      ) : isPending ? (
                        <button
                          onClick={() => requestApproveApplication(u)}
                          disabled={loadingAction === u.uid}
                          className="btn-primary"
                          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                        >
                          Approve Application
                        </button>
                      ) : (
                        <select
                          value={u.role}
                          disabled={loadingAction === u.uid}
                          onChange={(e) => requestRoleChange(u, e.target.value as UserRole)}
                          style={{
                            background: 'var(--dark)',
                            border: '1px solid rgba(255,255,255,.1)',
                            borderRadius: '4px',
                            padding: '6px 10px',
                            color: '#fff',
                            fontSize: '0.8rem',
                            outline: 'none'
                          }}
                        >
                          <option value="member">Member</option>
                          <option value="captain">Captain</option>
                          <option value="admin">Promote to Admin</option>
                          <option value="pending">Revert to Pending</option>
                        </select>
                      )}
                    </div>

                    {u.role === 'captain' ? (
                      <button
                        onClick={() => requestRevokeCaptain(u)}
                        disabled={loadingAction === u.uid}
                        style={{
                          background: 'rgba(255,70,85,.1)',
                          border: '1px solid rgba(255,70,85,.3)',
                          color: '#ff4655',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        Revoke Captain
                      </button>
                    ) : u.role === 'member' && isApproved ? (
                      <button
                        onClick={() => requestAssignCaptain(u)}
                        disabled={loadingAction === u.uid}
                        style={{
                          background: 'rgba(168,85,247,.1)',
                          border: '1px solid rgba(168,85,247,.3)',
                          color: '#c084fc',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        Make Captain
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* CONFIRMATION MODAL DIALOG */}
      {confirmModal && confirmModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              background: 'var(--dark2)',
              border: `1px solid ${confirmModal.isDestructive ? 'rgba(255,70,85,.5)' : 'rgba(0,229,255,.4)'}`,
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: `0 24px 60px rgba(0,0,0,.8), 0 0 30px ${confirmModal.isDestructive ? 'rgba(255,70,85,.15)' : 'rgba(0,229,255,.15)'}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Shield size={22} color={confirmModal.isDestructive ? '#ff4655' : 'var(--cyan)'} />
              <h3 id="confirm-modal-title" style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.15rem', color: '#fff' }}>
                {confirmModal.title}
              </h3>
            </div>

            <p style={{ color: '#e0e8f0', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '16px' }}>
              {confirmModal.message}
            </p>

            {confirmModal.warning && (
              <div
                style={{
                  background: confirmModal.isDestructive ? 'rgba(255,70,85,.08)' : 'rgba(250,204,21,.08)',
                  border: `1px solid ${confirmModal.isDestructive ? 'rgba(255,70,85,.25)' : 'rgba(250,204,21,.25)'}`,
                  borderRadius: '6px',
                  padding: '12px 14px',
                  color: confirmModal.isDestructive ? '#ff8a98' : '#facc15',
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                  marginBottom: '24px'
                }}
              >
                {confirmModal.warning}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                autoFocus
                onClick={() => setConfirmModal(null)}
                className="btn-outline"
                style={{ padding: '10px 18px', fontSize: '0.88rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={confirmModal.isDestructive ? 'btn-danger' : 'btn-primary'}
                style={{
                  padding: '10px 22px',
                  fontSize: '0.88rem',
                  background: confirmModal.isDestructive ? 'linear-gradient(135deg, #b91c1c, #ef4444)' : undefined,
                  border: confirmModal.isDestructive ? 'none' : undefined,
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
