import { z } from 'zod';
import { ETH_AMOUNT_PATTERN } from '@/lib/eth-math';

export const WalletNetworkSchema = z.enum(['Ethereum Mainnet', 'Polygon', 'Arbitrum']);
export type WalletNetwork = z.infer<typeof WalletNetworkSchema>;

export const WalletSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Endereço hexadecimal de carteira inválido'),
  network: WalletNetworkSchema,
  balanceEth: z.string().regex(ETH_AMOUNT_PATTERN),
  isPrimary: z.boolean().default(false),
  connectedAt: z.string()
});

export type Wallet = z.infer<typeof WalletSchema>;
