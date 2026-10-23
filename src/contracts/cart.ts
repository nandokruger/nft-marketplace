import { z } from 'zod';
import { ETH_AMOUNT_PATTERN } from '@/lib/eth-math';
import { NftSchema } from './nft';

export const CartItemSchema = z.object({
  nftId: z.string(),
  nft: NftSchema,
  quantity: z.number().int().positive().default(1),
  priceSnapshotEth: z.string().regex(ETH_AMOUNT_PATTERN)
});

export type CartItem = z.infer<typeof CartItemSchema>;

export const CouponSchema = z.object({
  code: z.string(),
  discountPercentage: z.string().regex(ETH_AMOUNT_PATTERN),
  description: z.string(),
  isValid: z.boolean(),
  minOrderEth: z.string().regex(ETH_AMOUNT_PATTERN).optional()
});

export type Coupon = z.infer<typeof CouponSchema>;

export const CartSchema = z.object({
  items: z.array(CartItemSchema),
  couponCode: z.string().nullable().default(null),
  discountPercentage: z.string().regex(ETH_AMOUNT_PATTERN).default('0'),
  subtotalEth: z.string().regex(ETH_AMOUNT_PATTERN),
  discountEth: z.string().regex(ETH_AMOUNT_PATTERN),
  networkFeeEth: z.string().regex(ETH_AMOUNT_PATTERN),
  totalEth: z.string().regex(ETH_AMOUNT_PATTERN),
  updatedAt: z.string()
});

export type Cart = z.infer<typeof CartSchema>;

export const QuoteResponseSchema = z.object({
  cart: CartSchema,
  warnings: z.array(z.string()),
  hasPriceChange: z.boolean(),
  hasStockIssue: z.boolean(),
  isValid: z.boolean()
});

export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;

