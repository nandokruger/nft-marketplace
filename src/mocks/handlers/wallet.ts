import { http, HttpResponse } from 'msw';
import { dbManager } from '../db';
import { scenarioManager } from '../scenarios';
import { z } from 'zod';
import { WalletNetworkSchema } from '@/contracts';

const CreateWalletSchema = z.object({
  name: z.string().min(2),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Endereço hexadecimal inválido'),
  network: WalletNetworkSchema,
  balanceEth: z.string().default('1.5')
});

export const walletHandlers = [
  http.get('/api/wallets', async ({ request }) => {
    const chaos = await scenarioManager.handleChaos(request, true);
    if (chaos) return chaos;

    const authHeader = request.headers.get('Authorization');
    const db = dbManager.getDb();

    let userId = 'user_1';
    if (authHeader?.startsWith('Bearer mock-token-')) {
      userId = authHeader.replace('Bearer mock-token-', '').split('-')[0]!;
    }

    let wallets = db.wallets.filter((w) => w.userId === userId);
    if (wallets.length === 0) {
      wallets = [
        {
          id: 'wallet-1',
          userId,
          name: 'Reserva',
          address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
          network: 'Polygon',
          balanceEth: '50.0',
          isPrimary: false,
          connectedAt: new Date().toISOString()
        },
        {
          id: 'wallet-2',
          userId,
          name: 'Principal',
          address: '0xA91F56872D1E0C9B8A7F6E5D4C3B2A1F0EA8E82C',
          network: 'Ethereum Mainnet',
          balanceEth: '50.0',
          isPrimary: true,
          connectedAt: new Date().toISOString()
        }
      ];
      db.wallets.push(...wallets);
    }

    return HttpResponse.json(wallets);
  }),

  http.post('/api/wallets', async ({ request }) => {
    const chaos = await scenarioManager.handleChaos(request, true);
    if (chaos) return chaos;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer mock-token-')) {
      return HttpResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    const userId = authHeader.replace('Bearer mock-token-', '').split('-')[0]!;

    const body = await request.json();
    const parsed = CreateWalletSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json({ error: 'BAD_REQUEST', details: parsed.error.format() }, { status: 400 });
    }

    const { name, address, network, balanceEth } = parsed.data;
    const db = dbManager.getDb();
    const userWallets = db.wallets.filter((w) => w.userId === userId);
    const isFirst = userWallets.length === 0;

    const newWallet = {
      id: `wallet_${Date.now()}`,
      userId,
      name,
      address,
      network,
      balanceEth,
      isPrimary: isFirst,
      connectedAt: new Date().toISOString()
    };

    dbManager.updateDb((d) => {
      d.wallets.push(newWallet);
    });

    return HttpResponse.json(newWallet, { status: 201 });
  }),

  http.patch('/api/wallets/:id/primary', async ({ params, request }) => {
    const chaos = await scenarioManager.handleChaos(request, true);
    if (chaos) return chaos;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer mock-token-')) {
      return HttpResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    const userId = authHeader.replace('Bearer mock-token-', '').split('-')[0]!;
    const { id } = params;

    const db = dbManager.getDb();
    const target = db.wallets.find((w) => w.id === id && w.userId === userId);
    if (!target) {
      return HttpResponse.json({ error: 'NOT_FOUND', message: 'Carteira não encontrada' }, { status: 404 });
    }

    dbManager.updateDb((d) => {
      for (const w of d.wallets) {
        if (w.userId === userId) {
          w.isPrimary = w.id === id;
        }
      }
      const user = d.users.find((u) => u.id === userId);
      if (user) {
        user.primaryWalletAddress = target.address;
      }
    });

    return HttpResponse.json(target);
  }),

  http.delete('/api/wallets/:id', async ({ params, request }) => {
    const chaos = await scenarioManager.handleChaos(request, true);
    if (chaos) return chaos;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer mock-token-')) {
      return HttpResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    const userId = authHeader.replace('Bearer mock-token-', '').split('-')[0]!;
    const { id } = params;

    dbManager.updateDb((d) => {
      d.wallets = d.wallets.filter((w) => !(w.id === id && w.userId === userId));
    });

    return HttpResponse.json({ success: true });
  })
];
