import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import { initSocket } from './lib/socket';
import { parseSearch, stringifySearch } from './lib/search-params';
import { enableMocking } from './mocks/browser';
import { routeTree } from './routeTree.gen';
import './styles/index.css';

const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
  defaultPreload: 'intent',
  parseSearch,
  stringifySearch,
  context: {
    queryClient
  }
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

async function startApp() {
  // Always initialize MSW worker in both Dev and Preview/E2E modes
  await enableMocking();

  const rootElement = document.getElementById('root');
  if (rootElement && !rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </React.StrictMode>
    );
  }

  // Initialize Socket.IO connection non-blockingly without delaying First Contentful Paint
  void initSocket(queryClient);
}

startApp().catch((err) => {
  console.error('[KURIO] Falha crítica na inicialização da aplicação:', err);
});
