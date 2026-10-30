import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { approveApplication, rejectApplication } from '../../services/applicationService';
import { useAuth } from '../../context/AuthContext';
import type { RegistrationApplication } from '../../types/auth';

export const AdminApplicationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<RegistrationApplication[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    const appsRef = collection(db, 'applications');
    const unsub = onSnapshot(
      appsRef,
      (snapshot) => {
        const apps: RegistrationApplication[] = [];
        snapshot.forEach((d) => apps.push(d.data() as RegistrationApplication));
        setApplications(apps);
      },
      (err) => console.error('Error fetching applications:', err)
    );
    return () => unsub();
  }, []);

  const handleApprove = async (appId: string) => {
    if (!currentUser) return;
    if (window.confirm('Approve this operative application? User will be promoted to Member.')) {
      setLoadingAction(appId);
      try {
        await approveApplication(appId, currentUser.uid);
      } catch (err: any) {
        alert(err.message || 'Approval failed.');
      } finally {
        setLoadingAction(null);
      }
    }
  };

  const handleReject = async (appId: string) => {
    if (!currentUser) return;
    const reason = window.prompt('Specify reason for decline (or press OK for default):', 'Application declined');
    if (reason !== null) {
      setLoadingAction(appId);
      try {
        await rejectApplication(appId, currentUser.uid, reason);
      } catch (err: any) {
        alert(err.message || 'Rejection failed.');
      } finally {
        setLoadingAction(null);
      }
    }
  };

  const filtered = applications.filter((a) => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  return (
    <div style={{ background: 'var(--dark2)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', padding: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.25rem', color: '#fff' }}>
            Operative Applications Queue
          </h2>
          <p style={{ color: '#5a7a9a', fontSize: '0.85rem' }}>Review dossiers and assign organizational clearance</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              style={{
                background: filter === st ? 'linear-gradient(135deg,#1565c0,#0288d1)' : 'rgba(255,255,255,.04)',
                color: filter === st ? '#fff' : '#7a9ab5',
                border: '1px solid',
                borderColor: filter === st ? 'var(--cyan)' : 'rgba(255,255,255,.08)',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: '#4a6a8a', padding: '24px 0', textAlign: 'center' }}>No applications found matching filter.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>Operative</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>Game Division</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>In-Game ID</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>Preferred Role</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '12px', color: '#4a6a8a', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ color: '#fff', fontWeight: 600 }}>{app.displayName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#4a6a8a', fontFamily: 'Orbitron, monospace' }}>
                      IGN: {app.gamingUsername}
                    </div>
                  </td>
                  <td style={{ padding: '14px 12px', color: 'var(--cyan)' }}>{app.preferredGame}</td>
                  <td style={{ padding: '14px 12px', color: '#8ca0b8', fontFamily: 'Orbitron, monospace', fontSize: '0.8rem' }}>
                    {app.inGameId || 'N/A'}
                  </td>
                  <td style={{ padding: '14px 12px', color: '#e0e8f0' }}>{app.preferredRole || 'Player'}</td>
                  <td style={{ padding: '14px 12px' }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '100px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background:
                          app.status === 'approved'
                            ? 'rgba(74,222,128,.12)'
                            : app.status === 'rejected'
                            ? 'rgba(255,70,85,.12)'
                            : 'rgba(250,204,21,.12)',
                        color:
                          app.status === 'approved' ? '#4ade80' : app.status === 'rejected' ? '#ff4655' : '#facc15',
                        border: '1px solid',
                        borderColor:
                          app.status === 'approved'
                            ? 'rgba(74,222,128,.3)'
                            : app.status === 'rejected'
                            ? 'rgba(255,70,85,.3)'
                            : 'rgba(250,204,21,.3)'
                      }}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                    {app.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApprove(app.id)}
                          disabled={loadingAction === app.id}
                          style={{
                            background: 'rgba(74,222,128,.1)',
                            border: '1px solid rgba(74,222,128,.3)',
                            color: '#4ade80',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase'
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          disabled={loadingAction === app.id}
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
                      </>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#4a6a8a' }}>Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
