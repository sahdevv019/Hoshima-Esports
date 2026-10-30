import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { User } from 'firebase/auth';
import type { UserProfile, UserRole, UserStatus } from '../types/auth';
import {
  signInWithGoogle,
  signOutUser,
  subscribeToAuthState,
  handleRedirectResult
} from '../services/authService';
import {
  ensureUserProfile,
  subscribeToUserProfile,
  getUserProfile
} from '../services/profileService';

interface AuthContextValue {
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: UserRole | null;
  status: UserStatus | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for mobile redirect auth response on initial page mount
    handleRedirectResult()
      .then((user) => {
        if (user) {
          console.log('[Hoshima Auth] Google redirect sign-in successful for:', user.email);
        }
      })
      .catch((err) => {
        console.error('[Hoshima Auth] Redirect resolution error:', err);
        setError(err.message);
      });

    let profileUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = subscribeToAuthState(async (user) => {
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      setCurrentUser(user);

      if (user) {
        try {
          // Race-safe profile ensure: creates pending profile if first login
          const profile = await ensureUserProfile(
            user.uid,
            user.email,
            user.displayName
          );
          setUserProfile(profile);

          // Real-time listener for profile changes (e.g. admin approval)
          profileUnsubscribe = subscribeToUserProfile(user.uid, (updatedProfile) => {
            if (updatedProfile) {
              setUserProfile(updatedProfile);
            }
          });
        } catch (err: any) {
          console.error('[Hoshima Auth] Profile setup failed:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOutUser();
      setUserProfile(null);
      setCurrentUser(null);
    } catch (err: any) {
      setError(err.message || 'Logout failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      const p = await getUserProfile(currentUser.uid);
      if (p) setUserProfile(p);
    }
  };

  const role = userProfile ? userProfile.role : null;
  const status = userProfile ? userProfile.status : null;

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      role,
      status,
      loading,
      error,
      loginWithGoogle,
      logout,
      refreshProfile
    }),
    [currentUser, userProfile, role, status, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
