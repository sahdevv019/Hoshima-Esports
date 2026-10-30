import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToAllUsers } from '../../services/memberService';
import { subscribeToPendingApplications, approveApplication, rejectApplication } from '../../services/applicationService';
import { useAuth } from '../../context/AuthContext';
import type { UserProfile, RegistrationApplication } from '../../types/auth';
export const AdminOverviewPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingApps, setPendingApps] = useState<RegistrationApplication[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const unsubUsers = subscribeToAllUsers(setUsers);
    const unsubApps = subscribeToPendingApplications(setPendingApps);
    return () => {
      unsubUsers();
      unsubApps();
    };
  }, []);

  const approvedMembers = users.filter((u) => u.role === 'member' || u.role === 'captain' || u.role === 'admin').length;
  const pendingCount = users.filter((u) => u.role === 'pending' || u.status === 'pending').length;
  const captainsCount = users.filter((u) => u.role === 'captain').length;
  const adminsCount = users.filter((u) => u.role === 'admin').length;

  const handleApprove = async (targetUid: string) => {
    if (!currentUser) return;
    if (window.confirm('Approve this operative application and grant Member privileges?')) {
      setActionLoading(targetUid);
      try {
        await approveApplication(targetUid, currentUser.uid);
      } catch (err: any) {
        alert(err.message || 'Approval failed.');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleReject = async (targetUid: string) => {
    if (!currentUser) return;
    if (window.confirm('Decline this application? User will remain restricted.')) {
      setActionLoading(targetUid);
      try {
        await rejectApplication(targetUid, currentUser.uid, 'Does not meet current team criteria');
      } catch (err: any) {
        alert(err.message || 'Rejection failed.');
      } finally {
        setActionLoading(null);
      }
    }
  };

  return (
    <div>
      {/* Real Firestore Live Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '48px'
        }}
      >
        <div style={{ background: 'var(--dark3)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '8px', padding: '24px' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '2.2rem', fontWeight: 900, background: 'linear-gradient(135deg,#fff,#00e5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {approvedMembers}
          </div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4a6a8a', marginTop: '6px' }}>
            Approved Members
          </div>
        </div>

        <div style={{ background: 'var(--dark3)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '8px', padding: '24px' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '2.2rem', fontWeight: 900, background: 'linear-gradient(135deg,#fff,#facc15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {pendingCount}
          </div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4a6a8a', marginTop: '6px' }}>
            Pending Review
          </div>
        </div>

        <div style={{ background: 'var(--dark3)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '8px', padding: '24px' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '2.2rem', fontWeight: 900, background: 'linear-gradient(135deg,#fff,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {captainsCount}
          </div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4a6a8a', marginTop: '6px' }}>
            Squad Captains
          </div>
        </div>

        <div style={{ background: 'var(--dark3)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '8px', padding: '24px' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '2.2rem', fontWeight: 900, background: 'linear-gradient(135deg,#fff,#ffd700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {adminsCount}
          </div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4a6a8a', marginTop: '6px' }}>
            Administrators
          </div>
        </div>
      </div>

      {/* Pending Applications Fast-Action Queue */}
      <div style={{ background: 'var(--dark2)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.2rem', color: '#fff' }}>
              Pending Applications ({pendingApps.length})
            </h3>
            <p style={{ color: '#5a7a9a', fontSize: '0.85rem' }}>Awaiting clearance review</p>
          </div>
          <Link to="/admin/applications" style={{ color: 'var(--cyan)', fontSize: '0.85rem', textDecoration: 'none' }}>
            View All Applications →
          </Link>
        </div>

        {pendingApps.length === 0 ? (
          <p style={{ color: '#4a6a8a', padding: '20px 0', fontSize: '0.95rem' }}>No pending applications in queue.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>Operative</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>Game</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>IGN / Role</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>Bio</th>
                  <th style={{ textAlign: 'right', padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>Decision</th>
                </tr>
              </thead>
              <tbody>
                {pendingApps.slice(0, 5).map((app) => (
                  <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ color: '#fff', fontWeight: 600 }}>{app.displayName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#5a7a9a' }}>{app.email}</div>
                    </td>
                    <td style={{ padding: '14px 12px', color: 'var(--cyan)' }}>{app.preferredGame}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ color: '#fff', fontFamily: 'Orbitron, monospace', fontSize: '0.85rem' }}>{app.gamingUsername}</div>
                      <div style={{ fontSize: '0.78rem', color: '#8ca0b8' }}>{app.preferredRole}</div>
                    </td>
                    <td style={{ padding: '14px 12px', color: '#7a9ab5', fontSize: '0.82rem', maxWidth: '240px' }}>
                      {app.bio}
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleApprove(app.id)}
                        disabled={actionLoading === app.id}
                        style={{
                          background: 'rgba(74,222,128,.1)',
                          border: '1px solid rgba(74,222,128,.3)',
                          color: '#4ade80',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(app.id)}
                        disabled={actionLoading === app.id}
                        style={{
                          background: 'rgba(255,70,85,.1)',
                          border: '1px solid rgba(255,70,85,.3)',
                          color: '#ff4655',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
