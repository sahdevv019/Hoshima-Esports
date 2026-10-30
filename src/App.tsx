import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { TeamsPage } from './pages/public/TeamsPage';
import { AchievementsPage } from './pages/public/AchievementsPage';
import { RecruitmentPage } from './pages/public/RecruitmentPage';
import { LoginPage } from './pages/public/LoginPage';
import { GameHubPage } from './pages/games/GameHubPage';
import { ScrimsDashboardPage } from './pages/scrims/ScrimsDashboardPage';
import { ScrimDetailsPage } from './pages/scrims/ScrimDetailsPage';
import { TournamentsDashboardPage } from './pages/tournaments/TournamentsDashboardPage';
import { TournamentDetailsPage } from './pages/tournaments/TournamentDetailsPage';
import { LeaderboardsPage } from './pages/public/LeaderboardsPage';

// Account Pages
import { PendingPage } from './pages/account/PendingPage';
import { DashboardPage } from './pages/account/DashboardPage';
import { ProfilePage } from './pages/account/ProfilePage';

// Captain Pages
import { CaptainPage } from './pages/captain/CaptainPage';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminApplicationsPage } from './pages/admin/AdminApplicationsPage';
import { AdminMembersPage } from './pages/admin/AdminMembersPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/scrims" element={<ScrimsDashboardPage />} />
              <Route path="/scrims/:scrimId" element={<ScrimDetailsPage />} />
              <Route path="/tournaments" element={<TournamentsDashboardPage />} />
              <Route path="/tournaments/:tournamentId" element={<TournamentDetailsPage />} />
              <Route path="/leaderboards" element={<LeaderboardsPage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/recruitment" element={<RecruitmentPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/game/:gameId" element={<GameHubPage />} />
              <Route path="/games/:gameId" element={<GameHubPage />} />

              {/* Account Routes */}
              <Route
                path="/pending"
                element={
                  <ProtectedRoute allowedRoles={['pending', 'member', 'captain', 'admin']}>
                    <PendingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['member', 'captain', 'admin']}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['pending', 'member', 'captain', 'admin']}>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Captain Route */}
              <Route
                path="/captain"
                element={
                  <ProtectedRoute allowedRoles={['captain', 'admin']}>
                    <CaptainPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminOverviewPage />} />
                <Route path="applications" element={<AdminApplicationsPage />} />
                <Route path="members" element={<AdminMembersPage />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
