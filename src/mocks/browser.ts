import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

export async function enableMocking(): Promise<void> {
  // Active in both development and preview/test environments to ensure offline reliability
  return worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`
    }
  }).then(() => {
    // Worker started
  }).catch((err) => {
    console.error('[MSW] Falha ao iniciar Service Worker:', err);
  });
}
