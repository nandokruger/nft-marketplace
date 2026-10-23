import { describe, expect, it } from 'vitest';
import { queryKeys } from '@/lib/query-keys';

describe('queryKeys — session isolation', () => {
  it('separa estritamente chaves públicas e privadas', () => {
    const publicList = queryKeys.catalog.list({ q: 'aether' });
    expect(publicList[0]).toBe('public');

    const privateCartUser1 = queryKeys.user.cart('user_1');
    expect(privateCartUser1[0]).toBe('private');
    expect(privateCartUser1[1]).toBe('user_1');

    const privateCartUser2 = queryKeys.user.cart('user_2');
    expect(privateCartUser2[1]).toBe('user_2');
    expect(privateCartUser1).not.toEqual(privateCartUser2);
  });

  it('isola pedidos e carteiras por userId', () => {
    const orders1 = queryKeys.user.orders.all('user_1');
    const orders2 = queryKeys.user.orders.all('user_2');
    expect(orders1).not.toEqual(orders2);

    const wallets1 = queryKeys.user.wallets('user_1');
    const wallets2 = queryKeys.user.wallets('user_2');
    expect(wallets1).not.toEqual(wallets2);
  });
});
