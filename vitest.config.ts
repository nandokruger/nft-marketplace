import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

// Config separada do Vite para não acionar o gerador de rotas durante testes unitários.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'src/**/*.test.ts'],
    environment: 'node',
  },
});
