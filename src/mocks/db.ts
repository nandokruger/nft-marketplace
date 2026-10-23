import type { Nft, NftNetwork, NftCategory, User, Wallet, Coupon, Cart, Order } from '@/contracts';
import { eth } from '@/lib/eth-math';
import { resolveAssetUrl } from '@/lib/assets';

export interface MockDatabase {
  nfts: Nft[];
  users: (User & { passwordHash: string })[];
  wallets: Wallet[];
  coupons: Coupon[];
  carts: Record<string, Cart>; // keyed by userId or 'guest'
  orders: Order[];
}

const STORAGE_KEY = '@jungle-nft:mock-db-v5';

const NETWORK_ROTATION: NftNetwork[] = ['ethereum', 'polygon', 'solana'];
const RARE_NFT_IDS = new Set(['nft-06', 'nft-08']);

/**
 * Completa um NFT com `network` e `rarity` determinísticos (a partir do id).
 * Roda apenas na camada MSW, então o banco persistido não precisa de migração.
 */
export function enrichNft(nft: Nft): Nft {
  const numericId = Number.parseInt(nft.id.replace(/\D/g, ''), 10) || 0;
  const net = nft.network ?? NETWORK_ROTATION[numericId % NETWORK_ROTATION.length] ?? 'ethereum';
  return {
    ...nft,
    imageUrl: resolveAssetUrl(nft.imageUrl),
    network: net,
    networks: nft.networks ?? [net],
    rarity: nft.rarity ?? (RARE_NFT_IDS.has(nft.id) ? 'rare' : 'common')
  };
}

export const INITIAL_USERS: (User & { passwordHash: string })[] = [
  {
    id: 'user_1',
    name: 'Satoshi Nakamoto',
    email: 'satoshi@kurio.app',
    passwordHash: 'password123',
    bio: 'Pioneering decentralized art collection on Kurio.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    primaryWalletAddress: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'user_2',
    name: 'Ada Lovelace',
    email: 'ada@kurio.app',
    passwordHash: 'password123',
    bio: 'Algorithmic curation and digital artifacts enthusiast.',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    primaryWalletAddress: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e',
    createdAt: '2026-01-15T00:00:00.000Z'
  }
];

export const INITIAL_WALLETS: Wallet[] = [
  {
    id: 'wallet-1',
    userId: 'user_1',
    name: 'Reserva',
    address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    network: 'Polygon',
    balanceEth: '50.0',
    isPrimary: false,
    connectedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'wallet-2',
    userId: 'user_1',
    name: 'Principal',
    address: '0xA91F56872D1E0C9B8A7F6E5D4C3B2A1F0EA8E82C',
    network: 'Ethereum Mainnet',
    balanceEth: '50.0',
    isPrimary: true,
    connectedAt: '2026-02-10T00:00:00.000Z'
  },
  {
    id: 'wallet-3',
    userId: 'user_2',
    name: 'Hardware Ledger',
    address: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e',
    network: 'Ethereum Mainnet',
    balanceEth: '42.0',
    isPrimary: true,
    connectedAt: '2026-01-15T00:00:00.000Z'
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    code: 'KURIO10',
    discountPercentage: '10',
    description: '10% de desconto no catálogo',
    isValid: true
  },
  {
    code: 'WELCOME20',
    discountPercentage: '20',
    description: '20% off para novos colecionadores',
    isValid: true,
    minOrderEth: '0.5'
  },
  {
    code: 'EXPIRED50',
    discountPercentage: '50',
    description: 'Cupom de teste expirado',
    isValid: false
  }
];

const CREATORS = [
  {
    id: 'creator_1',
    name: 'CyberRonin',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    address: '0x71c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0'
  },
  {
    id: 'creator_2',
    name: 'NeonValkyrie',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    address: '0x82d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1'
  },
  {
    id: 'creator_3',
    name: 'AetherLab',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    address: '0x93e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2'
  }
];

const BASE_NFTS: Nft[] = [
  {
    id: 'nft-01',
    name: 'Emerald Ape #042',
    collection: 'Emerald Apes',
    category: 'art',
    description: 'Edição limitada Emerald Ape com nanopartículas e adorno dourado em esmeralda pura.',
    imageUrl: '/assets/nfts/emerald-ape.webp',
    priceEth: '1.19',
    creator: CREATORS[0]!,
    owner: CREATORS[0]!,
    totalEditions: 10,
    availableEditions: 7,
    isFeatured: true,
    version: 1,
    createdAt: '2026-03-01T20:00:00.000Z'
  },
  {
    id: 'nft-02',
    name: 'Sage Nomad #009',
    collection: 'Nomad Tribe',
    category: 'art',
    description: 'Viajante dimensional equipado com manto protetor e bucket hat de expedição.',
    imageUrl: '/assets/nfts/sage-nomad.webp',
    priceEth: '1.69',
    creator: CREATORS[1]!,
    owner: CREATORS[1]!,
    totalEditions: 5,
    availableEditions: 2,
    isFeatured: true,
    version: 1,
    createdAt: '2026-03-01T19:00:00.000Z'
  },
  {
    id: 'nft-03',
    name: 'Neon Vessel #552',
    collection: 'Vessel Syndicate',
    category: 'art',
    description: 'Arquétipo aristocrático em gola alta cerâmica e acabamento terno marfim.',
    imageUrl: '/assets/nfts/neon-vessel.webp',
    priceEth: '1.99',
    creator: CREATORS[2]!,
    owner: CREATORS[2]!,
    totalEditions: 100,
    availableEditions: 42,
    isFeatured: false,
    version: 1,
    createdAt: '2026-03-01T18:00:00.000Z'
  },
  {
    id: 'nft-04',
    name: 'Cosmic Bloom #118',
    collection: 'Nomad Tribe',
    category: 'art',
    description: 'Manifestação cromática de florescimento cósmico sobre a linhagem nômade.',
    imageUrl: '/assets/nfts/sage-nomad.webp',
    priceEth: '1.29',
    creator: CREATORS[0]!,
    owner: CREATORS[0]!,
    totalEditions: 25,
    availableEditions: 11,
    isFeatured: false,
    version: 1,
    createdAt: '2026-03-01T17:00:00.000Z'
  },
  {
    id: 'nft-05',
    name: 'Violet Nomad #314',
    collection: 'Nomad Tribe',
    category: 'art',
    description: 'Nômade revestido em fibra violeta de alta densidade e isolamento magnético.',
    imageUrl: '/assets/nfts/sage-nomad.webp',
    priceEth: '1.39',
    creator: CREATORS[1]!,
    owner: CREATORS[1]!,
    totalEditions: 20,
    availableEditions: 15,
    isFeatured: false,
    version: 1,
    createdAt: '2026-03-01T16:00:00.000Z'
  },
  {
    id: 'nft-06',
    name: 'Ivory Baron #088',
    collection: 'Vessel Syndicate',
    category: 'art',
    description: 'Membro titular do conselho dos barões com assinatura criptográfica única.',
    imageUrl: '/assets/nfts/neon-vessel.webp',
    priceEth: '1.79',
    creator: CREATORS[2]!,
    owner: CREATORS[2]!,
    totalEditions: 25,
    availableEditions: 15,
    isFeatured: true,
    version: 1,
    createdAt: '2026-03-01T15:00:00.000Z'
  },
  {
    id: 'nft-07',
    name: 'Golden Beat #207',
    collection: 'Golden Beats',
    category: 'art',
    description: 'Harmonia sonora sintetizada através de fones transdutores de ouro 24K.',
    imageUrl: '/assets/nfts/golden-beat.webp',
    priceEth: '0.99',
    creator: CREATORS[0]!,
    owner: CREATORS[0]!,
    totalEditions: 50,
    availableEditions: 29,
    isFeatured: false,
    version: 1,
    createdAt: '2026-03-01T14:00:00.000Z'
  },
  {
    id: 'nft-08',
    name: 'Golden Beat #208',
    collection: 'Golden Beats',
    category: 'art',
    description: 'Sequenciador de frequências analógicas e batidas rítmicas de baixa latência.',
    imageUrl: '/assets/nfts/golden-beat.webp',
    priceEth: '0.89',
    creator: CREATORS[1]!,
    owner: CREATORS[1]!,
    totalEditions: 15,
    availableEditions: 4,
    isFeatured: false,
    version: 1,
    createdAt: '2026-03-01T13:00:00.000Z'
  },
  {
    id: 'nft-09',
    name: 'Golden Signal #160',
    collection: 'Golden Beats',
    category: 'art',
    description: 'Emissão contínua de sinal em ondas sonoras calibradas para ouvintes exigentes.',
    imageUrl: '/assets/nfts/golden-beat.webp',
    priceEth: '0.39',
    creator: CREATORS[2]!,
    owner: CREATORS[2]!,
    totalEditions: 12,
    availableEditions: 6,
    isFeatured: false,
    version: 1,
    createdAt: '2026-03-01T12:00:00.000Z'
  },
  {
    id: 'nft-10',
    name: 'Astral Mariner Codex',
    collection: 'Deep Orbit',
    category: 'photography',
    description: 'Diagramas de navegação interestelar compostos sob radiação gama controlada.',
    imageUrl: '/assets/nfts/sage-nomad.webp',
    priceEth: '0.22',
    creator: CREATORS[0]!,
    owner: CREATORS[0]!,
    totalEditions: 30,
    availableEditions: 19,
    isFeatured: false,
    version: 1,
    createdAt: '2026-02-10T19:40:00.000Z'
  },
  {
    id: 'nft-11',
    name: 'Synapse Pulse Harmonic',
    collection: 'Stellar Auditory',
    category: 'music',
    description: 'Gravação master de sinapse neuronal amplificada por ressonância magnética.',
    imageUrl: '/assets/nfts/golden-beat.webp',
    priceEth: '0.40',
    creator: CREATORS[1]!,
    owner: CREATORS[1]!,
    totalEditions: 20,
    availableEditions: 8,
    isFeatured: false,
    version: 1,
    createdAt: '2026-02-11T08:30:00.000Z'
  },
  {
    id: 'nft-12',
    name: 'Obsidian Monolith #00',
    collection: 'Forge of Titans',
    category: 'collectibles',
    description: 'Monólito de basalto negro facetado por corte molecular diamantado.',
    imageUrl: '/assets/nfts/neon-vessel.webp',
    priceEth: '3.10',
    creator: CREATORS[2]!,
    owner: CREATORS[2]!,
    totalEditions: 2,
    availableEditions: 1,
    isFeatured: true,
    version: 1,
    createdAt: '2026-02-12T22:15:00.000Z'
  },
  {
    id: 'nft-13',
    name: 'Elysian Canopy',
    collection: 'Aether Sentinels',
    category: 'generative',
    description: 'Estrutura abobadada inspirada na vegetação biomimética calculada algoritmicamente.',
    imageUrl: '/assets/nfts/sage-nomad.webp',
    priceEth: '0.55',
    creator: CREATORS[0]!,
    owner: CREATORS[0]!,
    totalEditions: 15,
    availableEditions: 12,
    isFeatured: false,
    version: 1,
    createdAt: '2026-02-13T10:00:00.000Z'
  },
  {
    id: 'nft-14',
    name: 'Vortex Sentinel 88',
    collection: 'Quantum Horizons',
    category: 'collectibles',
    description: 'Guardião de portais dimensionais equipado com emissor de tachyon integrado.',
    imageUrl: '/assets/nfts/neon-vessel.webp',
    priceEth: '0.78',
    creator: CREATORS[1]!,
    owner: CREATORS[1]!,
    totalEditions: 18,
    availableEditions: 5,
    isFeatured: false,
    version: 1,
    createdAt: '2026-02-14T15:20:00.000Z'
  },
  {
    id: 'nft-15',
    name: 'HyperDrive Turbine',
    collection: 'Cyberpunk Syndicate',
    category: 'gaming',
    description: 'Módulo propulsor que acelera o salto interestelar em 300% dentro do metaverso.',
    imageUrl: '/assets/nfts/golden-beat.webp',
    priceEth: '0.19',
    creator: CREATORS[2]!,
    owner: CREATORS[2]!,
    totalEditions: 80,
    availableEditions: 37,
    isFeatured: false,
    version: 1,
    createdAt: '2026-02-15T11:00:00.000Z'
  },
  {
    id: 'nft-16',
    name: 'Supernova Remnant 1987',
    collection: 'Deep Orbit',
    category: 'photography',
    description: 'Ondas de choque de plasma após o colapso estelar capturadas em múltiplos comprimentos de onda.',
    imageUrl: '/assets/nfts/emerald-ape.webp',
    priceEth: '0.67',
    creator: CREATORS[0]!,
    owner: CREATORS[0]!,
    totalEditions: 10,
    availableEditions: 3,
    isFeatured: false,
    version: 1,
    createdAt: '2026-02-16T14:10:00.000Z'
  },
  {
    id: 'nft-17',
    name: 'Zero Gravity Cantata',
    collection: 'Stellar Auditory',
    category: 'music',
    description: 'Concerto gravado a bordo da Estação Espacial Internacional com acústica orbital.',
    imageUrl: '/assets/nfts/golden-beat.webp',
    priceEth: '0.31',
    creator: CREATORS[1]!,
    owner: CREATORS[1]!,
    totalEditions: 40,
    availableEditions: 21,
    isFeatured: false,
    version: 1,
    createdAt: '2026-02-17T09:40:00.000Z'
  },
  {
    id: 'nft-18',
    name: 'Titanium Bloom',
    collection: 'Forge of Titans',
    category: '3d-art',
    description: 'Pétalas forjadas em titânio aeroespacial renderizadas em malha volumétrica 3D.',
    imageUrl: '/assets/nfts/emerald-ape.webp',
    priceEth: '1.80',
    creator: CREATORS[2]!,
    owner: CREATORS[2]!,
    totalEditions: 5,
    availableEditions: 2,
    isFeatured: true,
    version: 1,
    createdAt: '2026-02-18T16:50:00.000Z'
  },
  {
    id: 'nft-19',
    name: 'Cryptic Relic #42',
    collection: 'Temporal Decay',
    category: 'collectibles',
    description: 'Disco decodificador criptográfico selado em bloco de âmbar sintético.',
    imageUrl: '/assets/nfts/emerald-ape.webp',
    priceEth: '0.14',
    creator: CREATORS[0]!,
    owner: CREATORS[0]!,
    totalEditions: 60,
    availableEditions: 45,
    isFeatured: false,
    version: 1,
    createdAt: '2026-02-19T13:15:00.000Z'
  },
  {
    id: 'nft-20',
    name: 'Exo-Suit Catalyst',
    collection: 'Synthetic Fauna',
    category: 'gaming',
    description: 'Armadura bio-assistida para competições nos torneios da arena virtual.',
    imageUrl: '/assets/nfts/neon-vessel.webp',
    priceEth: '0.50',
    creator: CREATORS[1]!,
    owner: CREATORS[1]!,
    totalEditions: 25,
    availableEditions: 14,
    isFeatured: false,
    version: 1,
    createdAt: '2026-02-20T18:00:00.000Z'
  },
  {
    id: 'nft-21',
    name: 'Kinetics in Obsidian',
    collection: 'Optical Waves',
    category: '3d-art',
    description: 'Escultura interativa tridimensional calculada em malhas de vórtices de Euler.',
    imageUrl: '/assets/nfts/sage-nomad.webp',
    priceEth: '0.95',
    creator: CREATORS[2]!,
    owner: CREATORS[2]!,
    totalEditions: 8,
    availableEditions: 3,
    isFeatured: false,
    version: 1,
    createdAt: '2026-02-21T11:20:00.000Z'
  },
  {
    id: 'nft-22',
    name: 'Aurora Borealis Boreas',
    collection: 'Deep Orbit',
    category: 'photography',
    description: 'Fotografia de auroras polares de Marte capturadas por sonda em órbita elíptica.',
    imageUrl: '/assets/nfts/neon-vessel.webp',
    priceEth: '0.28',
    creator: CREATORS[0]!,
    owner: CREATORS[0]!,
    totalEditions: 35,
    availableEditions: 18,
    isFeatured: false,
    version: 1,
    createdAt: '2026-02-22T19:00:00.000Z'
  },
  {
    id: 'nft-23',
    name: 'Sub-Bass Tectonic',
    collection: 'Stellar Auditory',
    category: 'music',
    description: 'Composição em frequências infrassônicas ressonantes em câmaras subterrâneas.',
    imageUrl: '/assets/nfts/golden-beat.webp',
    priceEth: '0.12',
    creator: CREATORS[1]!,
    owner: CREATORS[1]!,
    totalEditions: 70,
    availableEditions: 52,
    isFeatured: false,
    version: 1,
    createdAt: '2026-02-23T21:30:00.000Z'
  },
  {
    id: 'nft-24',
    name: 'Genesis Core #Omega',
    collection: 'Aether Sentinels',
    category: 'generative',
    description: 'A joia culminante da primeira era Kurio. Arte generativa gravada em chave imutável.',
    imageUrl: '/assets/nfts/emerald-ape.webp',
    priceEth: '5.0',
    creator: CREATORS[0]!,
    owner: CREATORS[0]!,
    totalEditions: 1,
    availableEditions: 1,
    isFeatured: true,
    version: 1,
    createdAt: '2026-02-24T23:59:00.000Z'
  },
  {
    id: 'nft-25',
    name: 'Kurio Club VIP Pass',
    collection: 'Kurio Memberships',
    category: 'memberships',
    description: 'Passe de acesso vitalício aos leilões privados e drops antecipados de criadores.',
    imageUrl: '/assets/nfts/emerald-ape.webp',
    priceEth: '0.50',
    creator: CREATORS[0]!,
    owner: CREATORS[0]!,
    totalEditions: 100,
    availableEditions: 48,
    isFeatured: true,
    version: 1,
    createdAt: '2026-02-25T10:00:00.000Z'
  },
  {
    id: 'nft-26',
    name: 'Patron Key Platinum',
    collection: 'Kurio Memberships',
    category: 'memberships',
    description: 'Chave de membro fundador com taxa de corretagem zero e governança na DAO.',
    imageUrl: '/assets/nfts/neon-vessel.webp',
    priceEth: '1.20',
    creator: CREATORS[1]!,
    owner: CREATORS[1]!,
    totalEditions: 50,
    availableEditions: 12,
    isFeatured: false,
    version: 1,
    createdAt: '2026-02-25T11:00:00.000Z'
  },
  {
    id: 'nft-27',
    name: 'ZK Staking License',
    collection: 'Utility Modules',
    category: 'utility',
    description: 'Licença computacional para validação e recompensas em nós de zero-knowledge.',
    imageUrl: '/assets/nfts/sage-nomad.webp',
    priceEth: '0.75',
    creator: CREATORS[2]!,
    owner: CREATORS[2]!,
    totalEditions: 30,
    availableEditions: 9,
    isFeatured: false,
    version: 1,
    createdAt: '2026-02-26T12:00:00.000Z'
  },
  {
    id: 'nft-28',
    name: 'Decentralized Oracle Key',
    collection: 'Utility Modules',
    category: 'utility',
    description: 'Módulo de oráculo criptográfico para feeds de dados de alta precisão.',
    imageUrl: '/assets/nfts/golden-beat.webp',
    priceEth: '0.45',
    creator: CREATORS[0]!,
    owner: CREATORS[0]!,
    totalEditions: 25,
    availableEditions: 7,
    isFeatured: false,
    version: 1,
    createdAt: '2026-02-26T14:00:00.000Z'
  }
];

function buildInitialNfts(): Nft[] {
  const result: Nft[] = [...BASE_NFTS];

  // Target counts matching Figma layout exactly:
  // Arte digital: 33
  // Fotografia: 12
  // Música: 65
  // Arte 3D: 39
  // Colecionáveis: 23
  // Generativa: 17
  // Jogos: 19
  // Assinaturas: 13
  // Utilidade: 18
  // Total = 239 NFTs

  const CATEGORY_EXPANSIONS: {
    category: NftCategory;
    needed: number;
    collection: string;
    titlePrefix: string;
    image: string;
  }[] = [
      { category: 'art', needed: 24, collection: 'Emerald Apes', titlePrefix: 'Cyber Shogun', image: '/assets/nfts/emerald-ape.webp' },
      { category: 'photography', needed: 9, collection: 'Deep Orbit', titlePrefix: 'Stellar Exposure', image: '/assets/nfts/sage-nomad.webp' },
      { category: 'music', needed: 63, collection: 'Golden Beats', titlePrefix: 'Quantum Harmonic', image: '/assets/nfts/golden-beat.webp' },
      { category: '3d-art', needed: 37, collection: 'Dimension 3D', titlePrefix: 'Voxel Singularity', image: '/assets/nfts/neon-vessel.webp' },
      { category: 'collectibles', needed: 21, collection: 'Forge of Titans', titlePrefix: 'Titan Relic', image: '/assets/nfts/neon-vessel.webp' },
      { category: 'generative', needed: 14, collection: 'Aether Sentinels', titlePrefix: 'Algorithm Echo', image: '/assets/nfts/sage-nomad.webp' },
      { category: 'gaming', needed: 17, collection: 'Arcane Armory', titlePrefix: 'Plasma Blade', image: '/assets/nfts/emerald-ape.webp' },
      { category: 'memberships', needed: 11, collection: 'Aether Guild', titlePrefix: 'VIP Kurio Pass', image: '/assets/nfts/golden-beat.webp' },
      { category: 'utility', needed: 15, collection: 'Utility Modules', titlePrefix: 'Oracle Protocol', image: '/assets/nfts/sage-nomad.webp' }
    ];

  let nextId = 29;
  for (const exp of CATEGORY_EXPANSIONS) {
    for (let i = 0; i < exp.needed; i++) {
      const idNum = nextId++;
      const creatorIdx = idNum % CREATORS.length;
      // Distribute prices across 0.02 ETH to 12.30 ETH
      const priceRaw = (0.02 + ((idNum * 19) % 1228) / 100);
      const priceEth = priceRaw.toFixed(2);

      result.push({
        id: `nft-${String(idNum).padStart(2, '0')}`,
        name: `${exp.titlePrefix} #${String(idNum).padStart(3, '0')}`,
        collection: exp.collection,
        category: exp.category,
        description: `Item autêntico e registrado na blockchain para a coleção ${exp.collection}.`,
        imageUrl: exp.image,
        priceEth,
        creator: CREATORS[creatorIdx]!,
        owner: CREATORS[creatorIdx]!,
        totalEditions: 20,
        availableEditions: 10 + (idNum % 10),
        isFeatured: idNum % 15 === 0,
        version: 1,
        createdAt: new Date(Date.now() - idNum * 3600000).toISOString()
      });
    }
  }

  // Ensure minimum price 0.02 and maximum price 12.30 match the price slider in the layout:
  result[28]!.priceEth = '0.02';
  result[29]!.priceEth = '12.30';

  // Network distribution matching layout exactly:
  // Ethereum: 119
  // Polygon: 78
  // Solana: 86
  // Total network memberships = 283 across 239 NFTs:
  // - 75 Ethereum only
  // - 56 Polygon only
  // - 64 Solana only
  // - 22 Ethereum + Polygon
  // - 22 Ethereum + Solana
  for (let idx = 0; idx < result.length; idx++) {
    const nft = result[idx]!;
    if (idx < 75) {
      nft.network = 'ethereum';
      nft.networks = ['ethereum'];
    } else if (idx < 75 + 56) {
      nft.network = 'polygon';
      nft.networks = ['polygon'];
    } else if (idx < 75 + 56 + 64) {
      nft.network = 'solana';
      nft.networks = ['solana'];
    } else if (idx < 75 + 56 + 64 + 22) {
      nft.network = 'ethereum';
      nft.networks = ['ethereum', 'polygon'];
    } else {
      nft.network = 'ethereum';
      nft.networks = ['ethereum', 'solana'];
    }
  }

  return result;
}

export const INITIAL_NFTS: Nft[] = buildInitialNfts();

export const NETWORK_FEE_ETH = '0.016';

export function calculateCartTotals(items: Cart['items'], couponCode?: string | null): Omit<Cart, 'items'> {
  let subtotal = eth('0');
  for (const item of items) {
    const itemSub = eth(item.priceSnapshotEth).mulInt(item.quantity);
    subtotal = subtotal.add(itemSub);
  }

  let discountPercentage = '0';
  let discount = eth('0');

  if (couponCode) {
    const coupon = INITIAL_COUPONS.find(
      (c) => c.code.toUpperCase() === couponCode.toUpperCase() && c.isValid
    );
    if (coupon) {
      discountPercentage = coupon.discountPercentage;
      discount = subtotal.percent(discountPercentage);
    }
  }

  const networkFee = items.length > 0 ? eth(NETWORK_FEE_ETH) : eth('0');
  const total = subtotal.sub(discount).add(networkFee);

  return {
    couponCode: couponCode ?? null,
    discountPercentage,
    subtotalEth: subtotal.toString(),
    discountEth: discount.toString(),
    networkFeeEth: networkFee.toString(),
    totalEth: (total.isNegative() ? eth('0') : total).toString(),
    updatedAt: new Date().toISOString()
  };
}

export function createEmptyCart(): Cart {
  return {
    items: [],
    ...calculateCartTotals([], null)
  };
}

function createSeedDb(): MockDatabase {
  return {
    nfts: JSON.parse(JSON.stringify(INITIAL_NFTS)) as Nft[],
    users: JSON.parse(JSON.stringify(INITIAL_USERS)) as (User & { passwordHash: string })[],
    wallets: JSON.parse(JSON.stringify(INITIAL_WALLETS)) as Wallet[],
    coupons: JSON.parse(JSON.stringify(INITIAL_COUPONS)) as Coupon[],
    carts: {
      guest: createEmptyCart(),
      user_1: createEmptyCart()
    },
    orders: [
      {
        id: 'ord_figma_receipt',
        userId: 'user_1',
        idempotencyKey: 'idemp_figma_seed_001',
        items: [
          {
            nftId: 'nft-01',
            quantity: 2,
            priceSnapshotEth: '1.19',
            executedPriceEth: '1.19',
            nft: INITIAL_NFTS[0]!
          },
          {
            nftId: 'nft-05',
            quantity: 6,
            priceSnapshotEth: '1.39',
            executedPriceEth: '1.39',
            nft: INITIAL_NFTS[4]!
          },
          {
            nftId: 'nft-06',
            quantity: 9,
            priceSnapshotEth: '1.79',
            executedPriceEth: '1.79',
            nft: INITIAL_NFTS[5]!
          }
        ],
        couponCode: null,
        discountPercentage: '0',
        subtotalEth: '26.83',
        discountEth: '0',
        networkFeeEth: '0.016',
        totalEth: '26.846',
        walletAddress: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
        network: 'Ethereum Mainnet',
        status: 'CONFIRMED',
        txHash: '0xa91fcb789123456789abcdef0123456789a91fcb789123456789abcdef0123e82c',
        version: 1,
        createdAt: '2026-07-29T14:30:00.000Z',
        updatedAt: '2026-07-29T14:30:00.000Z'
      },
      {
        id: 'ord_pending_demo',
        userId: 'user_1',
        idempotencyKey: 'idemp_pending_seed_002',
        items: [
          {
            nftId: 'nft-01',
            quantity: 1,
            priceSnapshotEth: '1.19',
            executedPriceEth: '1.19',
            nft: INITIAL_NFTS[0]!
          }
        ],
        couponCode: null,
        discountPercentage: '0',
        subtotalEth: '1.19',
        discountEth: '0',
        networkFeeEth: '0.016',
        totalEth: '1.206',
        walletAddress: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
        network: 'Ethereum Mainnet',
        status: 'PENDING',
        version: 1,
        createdAt: '2026-07-29T14:35:00.000Z',
        updatedAt: '2026-07-29T14:35:00.000Z'
      },
      {
        id: 'ord_declined_demo',
        userId: 'user_1',
        idempotencyKey: 'idemp_declined_seed_003',
        items: [
          {
            nftId: 'nft-01',
            quantity: 1,
            priceSnapshotEth: '1.19',
            executedPriceEth: '1.19',
            nft: INITIAL_NFTS[0]!
          }
        ],
        couponCode: null,
        discountPercentage: '0',
        subtotalEth: '1.19',
        discountEth: '0',
        networkFeeEth: '0.016',
        totalEth: '1.206',
        walletAddress: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
        network: 'Ethereum Mainnet',
        status: 'DECLINED',
        statusReason: 'Saldo insuficiente de gás para execução da transação.',
        version: 1,
        createdAt: '2026-07-29T14:40:00.000Z',
        updatedAt: '2026-07-29T14:40:00.000Z'
      }
    ]
  };
}

class DatabaseManager {
  private memoryDb: MockDatabase = createSeedDb();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const serialized = window.localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        this.memoryDb = JSON.parse(serialized) as MockDatabase;
        if (Array.isArray(this.memoryDb.nfts)) {
          this.memoryDb.nfts = this.memoryDb.nfts.map((n) => ({
            ...n,
            imageUrl: resolveAssetUrl(n.imageUrl)
          }));
        }
      } else {
        this.persist();
      }
    } catch {
      this.memoryDb = createSeedDb();
    }
  }

  private persist() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memoryDb));
    } catch {
      // ignore in tests or storage quota limit
    }
  }

  getDb(): MockDatabase {
    return this.memoryDb;
  }

  updateDb(updater: (db: MockDatabase) => void): MockDatabase {
    updater(this.memoryDb);
    this.persist();
    return this.memoryDb;
  }

  reset(): MockDatabase {
    this.memoryDb = createSeedDb();
    this.persist();
    return this.memoryDb;
  }
}

export const dbManager = new DatabaseManager();
