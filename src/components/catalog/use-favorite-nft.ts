import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { queryKeys } from '@/lib/query-keys';
import type { Nft, NftListResponse } from '@/contracts';

interface FavoriteResponse {
  id: string;
  isFavorited: boolean;
  likesCount: number;
}

interface FavoriteContext {
  previousLists: [readonly unknown[], NftListResponse | undefined][];
  previousDetail: Nft | undefined;
}

const LIST_KEY = [...queryKeys.catalog.all, 'list'] as const;

function announce(message: string) {
  window.dispatchEvent(new CustomEvent<string>('kurio:announce', { detail: message }));
}

function toggled(nft: Nft): Nft {
  const nextFavorited = !nft.isFavorited;
  const currentLikes = nft.likesCount ?? 0;
  return {
    ...nft,
    isFavorited: nextFavorited,
    likesCount: nextFavorited ? currentLikes + 1 : Math.max(0, currentLikes - 1)
  };
}

/**
 * Favoritar com Optimistic Update: o coração muda imediatamente em todas as listas/detalhe
 * em cache e é revertido (rollback) se `POST /api/nfts/:id/favorite` falhar.
 */
export function useFavoriteNft(onNotice?: (message: string) => void) {
  const qc = useQueryClient();

  return useMutation<FavoriteResponse, Error, Nft, FavoriteContext>({
    mutationFn: async (nft) => {
      const res = await apiClient.post<FavoriteResponse>(`/api/nfts/${nft.id}/favorite`);
      return res.data;
    },
    onMutate: async (nft) => {
      await qc.cancelQueries({ queryKey: queryKeys.catalog.all });

      const previousLists = qc.getQueriesData<NftListResponse>({ queryKey: LIST_KEY });
      const previousDetail = qc.getQueryData<Nft>(queryKeys.catalog.detail(nft.id));

      qc.setQueriesData<NftListResponse>({ queryKey: LIST_KEY }, (old) =>
        old
          ? { ...old, items: old.items.map((item) => (item.id === nft.id ? toggled(item) : item)) }
          : old
      );
      if (previousDetail) {
        qc.setQueryData<Nft>(queryKeys.catalog.detail(nft.id), toggled(previousDetail));
      }

      announce(
        nft.isFavorited
          ? `${nft.name} removido dos favoritos.`
          : `${nft.name} adicionado aos favoritos.`
      );
      return { previousLists, previousDetail };
    },
    onError: (_error, nft, context) => {
      context?.previousLists.forEach(([key, data]) => qc.setQueryData(key, data));
      if (context?.previousDetail) {
        qc.setQueryData(queryKeys.catalog.detail(nft.id), context.previousDetail);
      }
      const message = `Não foi possível atualizar os favoritos de "${nft.name}". A alteração foi desfeita.`;
      announce(message);
      onNotice?.(message);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.catalog.all });
    }
  });
}
