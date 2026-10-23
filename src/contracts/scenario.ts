import { z } from 'zod';

export const ScenarioTypeSchema = z.enum([
  'default',
  'slow-network',
  'out-of-order',
  'network-error',
  'http-500',
  'session-expired',
  'price-changed-on-checkout',
  'edition-exhausted',
  'order-timeout-idempotent',
  'payment-declined'
]);

export type ScenarioType = z.infer<typeof ScenarioTypeSchema>;

export const ScenarioConfigSchema = z.object({
  activeScenario: ScenarioTypeSchema,
  description: z.string()
});

export type ScenarioConfig = z.infer<typeof ScenarioConfigSchema>;
