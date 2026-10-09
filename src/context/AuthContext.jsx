import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setAuthToken, getAuthToken } from '../lib/api.js';

/**
 * Real autentifikasiya konteksti — Freelancer.az backend API-sinə qoşulur.
 * İki hesab növü dəstəklənir: 'freelancer' və 'musteri' (sifarişçi).
 */

const AuthContext = createContext(null);

const emptyProfile = {
  fullName: '',
  about: '',
  avatarUrl: '',
  bannerUrl: '',
  isProfileVisible: true,
  status: '',
  activityAreas: [],
  experience: 'bir ilden azdir',
  hourlyRate: 0,
  rateType: '1 saat üçün',
  companyName: '',
  companyIndustry: '',
  companyWebsite: '',
  companySize: '',
  customerType: 'employer',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, fullName, email, role }
  const [profileData, setProfileData] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api.me()
      .then(({ user: u, profile }) => {
        setUser(u);
        setProfileData(profile);
      })
      .catch(() => {
        setAuthToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    api.updateOnlineStatus(true).catch(() => {});
    const heartbeat = window.setInterval(() => {
      api.updateOnlineStatus(true).catch(() => {});
    }, 30000);
    const onUnload = () => { api.updateOnlineStatus(false).catch(() => {}); };
    window.addEventListener('beforeunload', onUnload);
    return () => { window.clearInterval(heartbeat); onUnload(); window.removeEventListener('beforeunload', onUnload); };
  }, [user]);

  const applySession = ({ token, user: u, profile }) => {
    setAuthToken(token);
    setUser(u);
    setProfileData(profile || { ...emptyProfile, fullName: u.fullName });
  };

  const register = async (payload) => {
    setAuthError('');
    try {
      const data = await api.register(payload);
      applySession(data);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const login = async ({ email, password }) => {
    setAuthError('');
    try {
      const data = await api.login({ email, password });
      applySession(data);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setProfileData(emptyProfile);
  };

  const saveProfile = async (data) => {
    const updated = await api.updateProfile(data);
    setProfileData(updated);
    setUser((prev) => (prev ? { ...prev, fullName: updated.fullName } : prev));
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{ user, profileData, loading, authError, register, login, logout, saveProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider daxilində istifadə olunmalıdır');
  return ctx;
}
