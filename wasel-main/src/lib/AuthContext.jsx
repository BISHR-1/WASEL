import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from './supabase';
import { getCurrentUser } from '@/api/waselClient';

const AuthContext = createContext();
const AUTH_CHECK_TIMEOUT_MS = 3500;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAuth();

    // الاستماع لتغييرات الـ auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN' && session) {
        checkAuth();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    let timedOut = false;
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          timedOut = true;
          resolve(null);
        }, AUTH_CHECK_TIMEOUT_MS);
      });

      const currentUser = await Promise.race([getCurrentUser(), timeoutPromise]);

      // Fallback to auth user in case profile query hangs/fails.
      if (!currentUser && timedOut) {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (authUser) {
          setUser(authUser);
          setIsAuthenticated(true);
          return;
        }
      }
      
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthError({
        type: 'auth_error',
        message: error.message || 'Failed to check authentication'
      });
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async (shouldRedirect = false) => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
      
      if (shouldRedirect) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
