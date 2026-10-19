import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getStoredAuth, setStoredAuth, clearStoredAuth } from '../api/client';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    return getStoredAuth();
  });
  const [loading, setLoading] = useState(false);

  const login = (authData) => {
    // authData from POST /api/login: { token, role, name, expiresIn }
    const formatted = {
      token: authData.token,
      user: {
        name: authData.name,
        role: authData.role,
      },
    };
    setStoredAuth(formatted);
    setAuth(formatted);
  };

  const logout = () => {
    clearStoredAuth();
    setAuth(null);
  };

  const user = auth?.user || null;
  const token = auth?.token || null;
  const isAuthenticated = Boolean(token && user);
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated,
      isAdmin,
      isStudent,
      loading,
      login,
      logout,
    }),
    [user, token, isAuthenticated, isAdmin, isStudent, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
