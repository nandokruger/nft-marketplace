import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, AUTH_USER_KEY } from '@/lib/axios';
import { queryKeys } from '@/lib/query-keys';
import type { Cart, User } from '@/contracts';

/** Usuário autenticado (sessão em localStorage), reativo a login/logout em qualquer aba. */
export function useCurrentUser(): User | null {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const read = () => {
      try {
        const raw = window.localStorage.getItem(AUTH_USER_KEY);
        setUser(raw ? (JSON.parse(raw) as User) : null);
      } catch {
        setUser(null);
      }
    };
    read();
    window.addEventListener('storage', read);
    window.addEventListener('kurio:auth-changed', read);
    return () => {
      window.removeEventListener('storage', read);
      window.removeEventListener('kurio:auth-changed', read);
    };
  }, []);

  return user;
}

/** Quantidade total de itens no carrinho (mesma query/cache do Header). */
export function useCartItemCount(user: User | null): number {
  const { data: cart } = useQuery<Cart>({
    queryKey: queryKeys.user.cart(user ? user.id : 'guest'),
    queryFn: async () => {
      const res = await apiClient.get<Cart>('/api/cart');
      return res.data;
    }
  });
  return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}
