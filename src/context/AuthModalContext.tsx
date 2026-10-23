import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouterState } from '@tanstack/react-router';

interface AuthModalContextType {
  isOpen: boolean;
  mode: 'login' | 'register';
  redirectUrl?: string | undefined;
  openLogin: (redirectUrl?: string) => void;
  openRegister: (redirectUrl?: string) => void;
  close: () => void;
  setMode: (mode: 'login' | 'register') => void;
}

const AuthModalContext = createContext<AuthModalContextType | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const routerState = useRouterState();

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [redirectUrl, setRedirectUrl] = useState<string | undefined>(undefined);

  // Check URL search parameters (e.g., ?auth=login or ?auth=register)
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const authParam = searchParams.get('auth');
      const redirectParam = searchParams.get('redirect');

      if (authParam === 'login' || authParam === 'register') {
        setMode(authParam);
        if (redirectParam) setRedirectUrl(redirectParam);
        setIsOpen(true);
      }
    } catch {
      // ignore
    }
  }, [routerState.location.search]);

  // Global custom event listener for opening auth modal from non-React or deep contexts
  useEffect(() => {
    const handleOpenEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: 'login' | 'register'; redirectUrl?: string }>;
      const targetMode = customEvent.detail?.mode || 'login';
      setMode(targetMode);
      setRedirectUrl(customEvent.detail?.redirectUrl);
      setIsOpen(true);
    };

    window.addEventListener('kurio:open-auth-modal', handleOpenEvent);
    return () => {
      window.removeEventListener('kurio:open-auth-modal', handleOpenEvent);
    };
  }, []);

  const openLogin = useCallback((targetRedirectUrl?: string) => {
    setMode('login');
    setRedirectUrl(targetRedirectUrl);
    setIsOpen(true);
  }, []);

  const openRegister = useCallback((targetRedirectUrl?: string) => {
    setMode('register');
    setRedirectUrl(targetRedirectUrl);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Clean up ?auth= query param from URL if present without page reload
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('auth')) {
        url.searchParams.delete('auth');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        mode,
        redirectUrl,
        openLogin,
        openRegister,
        close,
        setMode
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}
