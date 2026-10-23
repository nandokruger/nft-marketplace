import { useEffect, useState } from 'react';

export function AriaLiveAnnouncer() {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const handleNftUpdate = (e: Event) => {
      const custom = e as CustomEvent<{ name: string; priceEth: string }>;
      if (custom.detail) {
        setAnnouncement(`Atualização em tempo real: O NFT ${custom.detail.name} teve seu preço atualizado para ${custom.detail.priceEth} ETH.`);
      }
    };

    const handleOrderUpdate = (e: Event) => {
      const custom = e as CustomEvent<{ id: string; status: string }>;
      if (custom.detail) {
        const statusMap: Record<string, string> = {
          CONFIRMED: 'confirmado com sucesso na blockchain',
          DECLINED: 'recusado pela rede blockchain'
        };
        const statusText = statusMap[custom.detail.status] || custom.detail.status;
        setAnnouncement(`Status do pedido ${custom.detail.id}: ${statusText}.`);
      }
    };

    const handleAnnounce = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (typeof custom.detail === 'string') setAnnouncement(custom.detail);
    };

    window.addEventListener('kurio:nft-updated', handleNftUpdate);
    window.addEventListener('kurio:order-updated', handleOrderUpdate);
    window.addEventListener('kurio:announce', handleAnnounce);

    return () => {
      window.removeEventListener('kurio:nft-updated', handleNftUpdate);
      window.removeEventListener('kurio:order-updated', handleOrderUpdate);
      window.removeEventListener('kurio:announce', handleAnnounce);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      id="aria-live-announcer"
    >
      {announcement}
    </div>
  );
}
