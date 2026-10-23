import { http, HttpResponse } from 'msw';
import { dbManager } from '../db';
import { scenarioManager } from '../scenarios';
import { LoginRequestSchema, RegisterRequestSchema } from '@/contracts';

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const chaos = await scenarioManager.handleChaos(request);
    if (chaos) return chaos;

    const body = await request.json();
    const parsed = LoginRequestSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json({ error: 'BAD_REQUEST', details: parsed.error.format() }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const db = dbManager.getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.passwordHash !== password) {
      return HttpResponse.json(
        { error: 'UNAUTHORIZED', message: 'Credenciais inválidas. Verifique seu e-mail e senha.' },
        { status: 401 }
      );
    }

    const { passwordHash: _, ...safeUser } = user;
    const token = `mock-token-${user.id}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return HttpResponse.json({ user: safeUser, token, expiresAt }, { status: 200 });
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const chaos = await scenarioManager.handleChaos(request);
    if (chaos) return chaos;

    const body = await request.json();
    const parsed = RegisterRequestSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json({ error: 'BAD_REQUEST', details: parsed.error.format() }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const db = dbManager.getDb();
    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return HttpResponse.json(
        { error: 'CONFLICT', message: 'Já existe uma conta associada a este endereço de e-mail.' },
        { status: 409 }
      );
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      bio: 'Novo colecionador no ecossistema Kurio.',
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      primaryWalletAddress: null,
      passwordHash: password,
      createdAt: new Date().toISOString()
    };

    dbManager.updateDb((d) => {
      d.users.push(newUser);
    });

    const { passwordHash: _, ...safeUser } = newUser;
    const token = `mock-token-${newUser.id}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return HttpResponse.json({ user: safeUser, token, expiresAt }, { status: 201 });
  }),

  http.get('/api/auth/me', async ({ request }) => {
    const chaos = await scenarioManager.handleChaos(request, true);
    if (chaos) return chaos;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer mock-token-')) {
      return HttpResponse.json({ error: 'UNAUTHORIZED', message: 'Sessão inválida' }, { status: 401 });
    }

    const userId = authHeader.replace('Bearer mock-token-', '').split('-')[0];
    const db = dbManager.getDb();
    const user = db.users.find((u) => u.id === userId);

    if (!user) {
      return HttpResponse.json({ error: 'UNAUTHORIZED', message: 'Usuário não encontrado' }, { status: 401 });
    }

    const { passwordHash: _, ...safeUser } = user;
    return HttpResponse.json({ user: safeUser }, { status: 200 });
  })
];
