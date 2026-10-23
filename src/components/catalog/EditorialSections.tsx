import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { resolveAssetUrl } from '@/lib/assets';

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
    imageUrl: resolveAssetUrl('/assets/nfts/neon-vessel.webp')
  },
  {
    id: 2,
    date: '13 de setembro',
    readTime: '2 min',
    title: '10 artistas digitais para acompanhar',
    summary: 'Conheça criadores que moldam a cultura digital.',
    fullText:
      'De ilustradores generativos a escultores em 3D, uma nova geração de artistas utiliza smart contracts na Ethereum, Polygon e Solana para criar identidades visuais descentralizadas que redefinem o mercado de arte global.',
    imageUrl: resolveAssetUrl('/assets/nfts/emerald-ape.webp')
  },
  {
    id: 3,
    date: '15 de setembro',
    readTime: '3 min',
    title: 'Raridade, atributos e procedência',
    summary: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    fullText:
      'Entenda como metadados armazenados em IPFS e hashes no contrato inteligente atestam a escassez matemática de coleções como Emerald Ape e Sage Nomad, garantindo autenticidade permanente.',
    imageUrl: resolveAssetUrl('/assets/nfts/sage-nomad.webp')
  },
  {
    id: 4,
    date: '15 de setembro',
    readTime: '2 min',
    title: 'Como proteger sua carteira',
    summary: 'Proteja sua carteira, seus ativos e sua identidade.',
    fullText:
      'Utilize carteiras não-custodiais, verifique assinaturas EIP-712 antes de assinar transações e mantenha frases de recuperação isoladas do ambiente conectado à rede.',
    imageUrl: resolveAssetUrl('/assets/nfts/golden-beat.webp')
  }
];

function EditorialArrowIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 93 78"
      width="12"
      height="10"
      fill="currentColor"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path
        fillRule="evenodd"
        d="M53.94,74.31C53.87,74.29 53.41,74.20 52.92,74.12C52.19,74.01 51.85,73.87 51.07,73.36C50.55,73.02 50.12,72.69 50.12,72.64C50.12,72.59 49.89,72.16 49.59,71.68L49.06,70.81L49.06,69.25L49.06,67.68L49.59,66.79C49.89,66.30 50.28,65.73 50.48,65.54C50.85,65.17 52.74,64.00 52.97,64.00C53.04,64.00 53.33,63.81 53.60,63.58C53.88,63.35 54.29,63.09 54.52,63.00C54.75,62.91 55.13,62.68 55.38,62.49C55.62,62.31 56.04,62.06 56.31,61.95C56.58,61.83 56.91,61.64 57.04,61.53C57.17,61.41 57.51,61.17 57.81,61.00C58.59,60.54 59.51,59.93 59.93,59.60C60.13,59.44 60.53,59.17 60.82,59.00C61.98,58.31 62.76,57.76 64.12,56.70C64.43,56.45 64.91,56.14 65.19,55.99C65.46,55.84 66.05,55.40 66.50,55.00C66.95,54.61 67.52,54.16 67.76,53.99C68.24,53.67 69.33,52.76 71.41,50.95C73.02,49.54 75.84,46.68 76.09,46.19C76.20,45.98 76.64,45.42 77.08,44.94C77.89,44.04 78.07,43.57 77.71,43.27C77.59,43.17 67.86,43.13 42.24,43.12C22.82,43.12 6.70,43.07 6.42,43.01C5.44,42.82 3.32,41.09 3.08,40.28C2.85,39.51 2.75,38.36 2.82,37.46C2.93,36.23 2.98,36.07 3.66,35.04C4.19,34.24 4.39,34.08 6.06,33.20L6.56,32.94L42.06,32.91C61.59,32.89 77.63,32.85 77.72,32.82C78.01,32.71 77.88,32.10 77.47,31.62C77.25,31.37 76.84,30.86 76.56,30.51C75.34,28.93 72.08,25.57 71.17,24.95C70.95,24.81 70.32,24.29 69.77,23.81C69.22,23.33 68.47,22.71 68.11,22.44C67.75,22.16 67.28,21.76 67.07,21.55C66.86,21.33 66.52,21.07 66.31,20.96C66.11,20.86 65.57,20.48 65.12,20.13C64.68,19.78 64.02,19.30 63.67,19.06C63.32,18.83 63.00,18.55 62.96,18.44C62.91,18.33 62.64,18.14 62.35,18.01C62.05,17.88 61.59,17.60 61.33,17.39C61.06,17.18 60.76,17.00 60.67,17.00C60.57,17.00 60.27,16.78 60.00,16.50C59.73,16.23 59.43,16.00 59.34,16.00C59.24,16.00 58.91,15.81 58.61,15.58C58.31,15.35 57.79,15.04 57.46,14.90C57.13,14.75 56.71,14.52 56.52,14.37C55.80,13.81 55.28,13.48 54.55,13.13C54.13,12.93 53.62,12.63 53.42,12.46C53.23,12.30 52.79,12.04 52.46,11.90C51.58,11.51 50.48,10.55 49.88,9.66C49.05,8.42 48.97,8.12 49.02,6.69C49.07,5.52 49.10,5.39 49.51,4.69C49.75,4.28 50.03,3.77 50.13,3.57C50.30,3.24 51.38,2.45 52.12,2.12C53.23,1.63 55.70,1.80 56.59,2.42C56.86,2.60 57.37,2.86 57.72,2.99C58.07,3.12 58.54,3.36 58.77,3.53C59.00,3.71 59.42,3.96 59.70,4.10C59.98,4.24 60.28,4.44 60.36,4.55C60.45,4.65 60.80,4.83 61.14,4.94C61.51,5.07 61.84,5.27 61.97,5.46C62.08,5.64 62.40,5.88 62.68,6.00C62.96,6.12 63.41,6.40 63.67,6.61C63.94,6.82 64.23,7.00 64.32,7.00C64.41,7.00 64.66,7.15 64.89,7.34C65.11,7.53 65.53,7.83 65.81,8.00C67.12,8.78 67.57,9.09 67.93,9.46C68.14,9.67 68.51,9.94 68.75,10.05C69.24,10.27 70.15,10.88 71.00,11.56C72.07,12.41 73.69,13.63 74.31,14.05C74.66,14.28 75.29,14.80 75.71,15.20C76.14,15.61 76.80,16.19 77.19,16.50C79.03,17.97 82.03,20.90 83.38,22.54C83.75,23.00 84.47,23.86 84.97,24.44C85.47,25.03 85.87,25.56 85.88,25.62C85.88,25.68 86.09,26.00 86.36,26.34C86.63,26.68 86.94,27.15 87.07,27.38C87.19,27.62 87.42,27.97 87.58,28.17C87.74,28.36 87.91,28.67 87.95,28.85C87.99,29.04 88.24,29.55 88.50,30.00C88.76,30.45 89.07,31.12 89.19,31.49C89.31,31.86 89.51,32.34 89.63,32.55C89.76,32.76 89.92,33.30 90.00,33.75C90.07,34.20 90.28,35.29 90.46,36.18C90.65,37.17 90.75,38.00 90.71,38.31C90.33,41.06 89.86,43.22 89.52,43.78C89.38,44.01 89.16,44.57 89.05,45.01C88.94,45.45 88.71,46.00 88.54,46.22C88.37,46.45 88.15,46.88 88.04,47.19C87.93,47.51 87.70,47.86 87.50,48.00C87.30,48.14 87.08,48.46 86.99,48.72C86.91,48.98 86.72,49.33 86.56,49.50C86.41,49.67 86.18,50.01 86.06,50.25C85.94,50.49 85.67,50.86 85.45,51.07C85.24,51.28 84.84,51.75 84.56,52.13C84.29,52.51 82.85,54.04 81.38,55.54C78.98,57.98 78.24,58.67 76.12,60.49C75.82,60.75 75.33,61.18 75.04,61.43C74.75,61.68 74.35,62.01 74.14,62.16C72.90,63.07 71.63,64.03 71.27,64.34C71.04,64.53 70.56,64.88 70.19,65.12C68.75,66.07 68.42,66.30 67.97,66.67C67.01,67.48 66.68,67.72 66.25,67.94C66.01,68.06 65.65,68.29 65.45,68.46C65.26,68.62 64.89,68.84 64.64,68.95C64.39,69.05 64.05,69.27 63.88,69.44C63.70,69.60 63.29,69.85 62.95,70.00C62.61,70.14 62.16,70.41 61.93,70.60C61.71,70.78 61.07,71.19 60.50,71.50C59.94,71.81 59.25,72.25 58.98,72.47C58.70,72.69 58.33,72.91 58.14,72.95C57.96,72.99 57.45,73.24 57.00,73.50C56.46,73.82 55.85,74.05 55.21,74.18C54.19,74.38 54.15,74.39 53.94,74.31Z"
      />
    </svg>
  );
}

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
              src={resolveAssetUrl('/assets/nfts/emerald-ape.webp')}
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
              src={resolveAssetUrl('/assets/nfts/neon-vessel.webp')}
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
