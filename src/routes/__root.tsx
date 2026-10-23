import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
// import { ScenarioDevToolbar } from '@/components/layout/ScenarioDevToolbar';
import { AriaLiveAnnouncer } from '@/components/layout/AriaLiveAnnouncer';
import { AuthModalProvider } from '@/context/AuthModalContext';
import { AuthModal } from '@/components/auth/AuthModal';

export const Route = createRootRoute({
  component: RootComponent
});

function RootComponent() {
  return (
    <AuthModalProvider>
      <div className="min-h-screen flex flex-col bg-ink text-foreground selection:bg-primary selection:text-ink font-mono">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-ink focus:font-bold focus:rounded-md focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-foreground"
        >
          Pular para o conteúdo principal
        </a>
        <AriaLiveAnnouncer />
        <Header />
        <main className="flex-1 w-full" id="main-content">
          <Outlet />
        </main>
        <Footer />
        {/* <ScenarioDevToolbar /> */}
        <AuthModal />
      </div>
    </AuthModalProvider>
  );
}

