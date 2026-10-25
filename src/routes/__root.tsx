import React, { Suspense } from 'react';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
// import { ScenarioDevToolbar } from '@/components/layout/ScenarioDevToolbar';
import { AriaLiveAnnouncer } from '@/components/layout/AriaLiveAnnouncer';
import { AuthModalProvider, useAuthModal } from '@/context/AuthModalContext';
import { useIsDesktop } from '@/lib/use-media-query';

const LazyAuthModal = React.lazy(() =>
  import('@/components/auth/AuthModal').then((m) => ({ default: m.AuthModal }))
);

function AuthModalHost() {
  const { isOpen } = useAuthModal();
  if (!isOpen) return null;
  return (
    <Suspense fallback={null}>
      <LazyAuthModal />
    </Suspense>
  );
}

export const Route = createRootRoute({
  component: RootComponent
});

function RootComponent() {
  const isDesktop = useIsDesktop();

  return (
    <AuthModalProvider>
      <div className="min-h-screen flex flex-col xl:px-0 lg:px-8 xl:px-0 bg-ink text-foreground selection:bg-primary selection:text-ink font-mono">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-ink focus:font-bold focus:rounded-md focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-foreground"
        >
          Pular para o conteúdo principal
        </a>
        <AriaLiveAnnouncer />
        {isDesktop && <Header />}
        <main className="flex-1 w-full" id="main-content">
          <Outlet />
        </main>
        {isDesktop && <Footer />}
        {/* <ScenarioDevToolbar /> */}
        <AuthModalHost />
      </div>
    </AuthModalProvider>
  );
}

