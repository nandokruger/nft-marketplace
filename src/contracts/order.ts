import { z } from 'zod';
import { ETH_AMOUNT_PATTERN } from '@/lib/eth-math';
import { CartItemSchema } from './cart';
import { WalletNetworkSchema } from './wallet';

export const OrderStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'DECLINED']);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderItemSnapshotSchema = CartItemSchema.extend({
  executedPriceEth: z.string().regex(ETH_AMOUNT_PATTERN)
});

export type OrderItemSnapshot = z.infer<typeof OrderItemSnapshotSchema>;

export const OrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  idempotencyKey: z.string(),
  items: z.array(OrderItemSnapshotSchema),
  couponCode: z.string().nullable().default(null),
  discountPercentage: z.string().regex(ETH_AMOUNT_PATTERN).default('0'),
  subtotalEth: z.string().regex(ETH_AMOUNT_PATTERN),
  discountEth: z.string().regex(ETH_AMOUNT_PATTERN),
  networkFeeEth: z.string().regex(ETH_AMOUNT_PATTERN),
  totalEth: z.string().regex(ETH_AMOUNT_PATTERN),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  network: WalletNetworkSchema,
  status: OrderStatusSchema,
  statusReason: z.string().optional(),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  version: z.number().int().nonnegative().default(1),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Order = z.infer<typeof OrderSchema>;

export const CreateOrderRequestSchema = z.object({
  idempotencyKey: z.string().min(8),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  network: WalletNetworkSchema,
  couponCode: z.string().optional()
});

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;
