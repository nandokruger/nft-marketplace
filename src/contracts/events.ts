import { z } from 'zod';
import { NftSchema } from './nft';
import { OrderSchema } from './order';

export const RealtimeEnvelopeSchema = <T extends z.ZodTypeAny>(payloadSchema: T) =>
  z.object({
    eventId: z.string(),
    version: z.number().int().nonnegative(),
    timestamp: z.string(),
    payload: payloadSchema
  });

export const NftUpdatedEventSchema = RealtimeEnvelopeSchema(NftSchema);
export type NftUpdatedEvent = z.infer<typeof NftUpdatedEventSchema>;

export const OrderUpdatedEventSchema = RealtimeEnvelopeSchema(OrderSchema);
export type OrderUpdatedEvent = z.infer<typeof OrderUpdatedEventSchema>;
