import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/nfts/$nftId')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/nft/$nftId',
      params: { nftId: params.nftId }
    });
  }
});
