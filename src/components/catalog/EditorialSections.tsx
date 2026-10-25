import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { resolveAssetUrl } from '@/lib/assets';
import { EditorialArrowIcon } from '@/components/icons';

interface BlogPost {
  id: number;
  date: string;
  readTime: string;
  title: string;
  summary: string;
  fullText: string;
  imageUrl: string;
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    date: '12 de setembro',
    readTime: '6 min',
    title: 'Como funciona a propriedade de NFTs',
    summary: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    fullText:
      'A posse verificada por criptografia garante que apenas o detentor da chave privada tenha autoridade sobre a transferência e fruição de um NFT, eliminando intermediários tradicionais e abrindo precedentes para novas formas de monetização e curadoria.',
    imageUrl: resolveAssetUrl('/assets/nfts/neon-vessel.png')
  },
  {
    id: 2,
    date: '13 de setembro',
    readTime: '2 min',
    title: '10 artistas digitais para acompanhar',
    summary: 'Conheça criadores que moldam a cultura digital.',
    fullText:
      'De ilustradores generativos a escultores em 3D, uma nova geração de artistas utiliza smart contracts na Ethereum, Polygon e Solana para criar identidades visuais descentralizadas que redefinem o mercado de arte global.',
    imageUrl: resolveAssetUrl('/assets/nfts/emerald-ape.png')
  },
  {
    id: 3,
    date: '15 de setembro',
    readTime: '3 min',
    title: 'Raridade, atributos e procedência',
    summary: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    fullText:
      'Entenda como metadados armazenados em IPFS e hashes no contrato inteligente atestam a escassez matemática de coleções como Emerald Ape e Sage Nomad, garantindo autenticidade permanente.',
    imageUrl: resolveAssetUrl('/assets/nfts/sage-nomad.png')
  },
  {
    id: 4,
    date: '15 de setembro',
    readTime: '2 min',
    title: 'Como proteger sua carteira',
    summary: 'Proteja sua carteira, seus ativos e sua identidade.',
    fullText:
      'Utilize carteiras não-custodiais, verifique assinaturas EIP-712 antes de assinar transações e mantenha frases de recuperação isoladas do ambiente conectado à rede.',
    imageUrl: resolveAssetUrl('/assets/nfts/golden-beat.png')
  }
];



interface EditorialSectionsProps {
  onExplorePromos?: () => void;
}

export function EditorialSections({ onExplorePromos }: EditorialSectionsProps) {
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedPostId((current) => (current === id ? null : id));
  };

  return (
    <div className="hidden lg:flex flex-col gap-24 w-full">
      {/* ========================================================================= */}
      {/* SECTION 1: PROMOS                 */}
      {/* ========================================================================= */}
      <section
        id="promos"
        aria-label="Destaques e Lançamentos Especiais"
        className="w-full grid grid-cols-1 lg:grid-cols-2 gap-7"
      >
        {/* Promo Card 1: Genesis Drops */}
        <Card className="rounded-[8px] bg-surface-card overflow-hidden flex flex-col sm:flex-row items-center h-auto sm:h-[250px] shadow-sm group border-0">
          <div className="w-full sm:w-[280px] h-[220px] sm:h-full shrink-0 overflow-hidden">
            <img
              src={resolveAssetUrl('/assets/nfts/emerald-ape.png')}
              alt="Lançamentos Gênesis"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-tr-lg rounded-br-lg"
              loading="lazy"
              width={280}
              height={250}
            />
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-between h-full gap-3 flex-1">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-right text-foreground leading-6 whitespace-pre-line">
                {'Lançamentos gênesis\nde edição limitada'}
              </h3>
              <p className="text-sm text-right text-text-secondary leading-6">
                Colecione edições escassas diretamente dos criadores antes da revelação pública.
              </p>
            </div>

            <a
              href="#catalog"
              onClick={onExplorePromos}
              className="mt-1 inline-block text-right"
            >
              <Button
                variant="default"
                className="w-[140px] h-[40px] rounded-[6px] text-sm font-semibold text-ink bg-primary hover:bg-[#c27c3e] cursor-pointer"
              >
                Explorar
                <EditorialArrowIcon />
              </Button>
            </a>
          </div>
        </Card>

        {/* Promo Card 2: Curated Art */}
        <Card className="rounded-[8px] bg-surface-card overflow-hidden flex flex-col sm:flex-row items-center h-auto sm:h-[250px] shadow-sm group border-0">
          <div className="w-full sm:w-[280px] h-[220px] sm:h-full shrink-0 overflow-hidden">
            <img
              src={resolveAssetUrl('/assets/nfts/neon-vessel.png')}
              alt="Arte digital selecionada"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-tr-lg rounded-br-lg"
              loading="lazy"
              width={280}
              height={250}
            />
          </div>

          <div className="p-6 sm:p-5 flex flex-col justify-between h-full gap-3 flex-1">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg text-right font-bold text-foreground leading-6 whitespace-pre-line">
                {'Arte digital selecionada\ne muito mais'}
              </h3>
              <p className="text-sm text-right text-text-secondary leading-6">
                Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.
              </p>
            </div>

            <a
              href="#catalog"
              onClick={onExplorePromos}
              className="mt-1 inline-block text-right"
            >
              <Button
                variant="default"
                className="w-[140px] h-[40px] rounded-[6px] text-sm font-semibold text-ink bg-primary hover:bg-[#c27c3e] cursor-pointer"
              >
                Explorar
                <EditorialArrowIcon />
              </Button>
            </a>
          </div>
        </Card>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: DIÁRIO DA CUNHAGEM, 4 Blog Cards)            */}
      {/* ========================================================================= */}
      <section
        id="blog"
        aria-label="Artigos e Diário da Cunhagem"
        className="w-full flex flex-col gap-8 pt-4 pb-6 mb-24"
      >
        <div className="flex flex-col gap-2 text-center max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-foreground">
            Diário da Cunhagem
          </h2>
          <p className="text-sm text-text-secondary leading-6">
            Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BLOG_POSTS.map((post) => {
            const isExpanded = expandedPostId === post.id;
            return (
              <Card
                key={post.id}
                className="w-full rounded-[8px] bg-surface-card overflow-hidden flex flex-col justify-between group hover:ring-1 hover:ring-primary/20 transition-all duration-200 border-0 shadow-none"
              >
                <div className="flex flex-col">
                  <div className="w-full h-[180px] overflow-hidden">
                    <img
                      src={resolveAssetUrl(post.imageUrl)}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      width={300}
                      height={180}
                    />
                  </div>
                  <div className="p-4 pt-3 flex flex-col gap-2">
                    <span className="text-xs text-text-secondary">
                      {post.date} | Leitura de {post.readTime}
                    </span>
                    <h3 className="text-base font-bold text-foreground leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {isExpanded ? post.fullText : post.summary}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    type="button"
                    onClick={() => toggleExpand(post.id)}
                    aria-expanded={isExpanded}
                    className="text-xs font-bold text-text-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isExpanded ? 'Mostrar menos ↑' : 'Ler mais →'}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}