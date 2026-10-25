import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { resolveAssetUrl } from '@/lib/assets';
import { HeroBackgroundGraphic } from '@/components/icons';

interface HeroSlide {
  src: string;
  alt: string;
}

const HERO_SLIDES: HeroSlide[] = [
  { src: resolveAssetUrl('/assets/nfts/emerald-ape.png'), alt: 'Emerald Ape #042 — arte em destaque' },
  { src: resolveAssetUrl('/assets/nfts/sage-nomad.png'), alt: 'Sage Nomad #009 — arte em destaque' },
  { src: resolveAssetUrl('/assets/nfts/neon-vessel.png'), alt: 'Neon Vessel #552 — arte em destaque' }
];

function HeroDots({
  active,
  onSelect,
  className
}: {
  active: number;
  onSelect: (index: number) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-0', className)} role="group" aria-label="Destaques da página inicial">
      {HERO_SLIDES.map((slide, index) => (
        <button
          key={slide.src}
          type="button"
          aria-label={`Mostrar destaque ${index + 1} de ${HERO_SLIDES.length}`}
          aria-current={active === index}
          onClick={() => onSelect(index)}
          className="flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer"
        >
          <span
            className={cn(
              'h-2 w-2 rounded-full bg-primary transition-opacity motion-reduce:transition-none',
              active === index ? 'opacity-100' : 'opacity-40'
            )}
          />
        </button>
      ))}
    </div>
  );
}

/**
 * Imagem do Hero = candidata a LCP: `fetchPriority="high"`, sem `loading="lazy"`,
 * `width`/`height` + `aspect-ratio` explícitos e fundo shimmer enquanto decodifica (CLS = 0).
 */
function HeroImage({
  slide,
  size,
  className
}: {
  slide: HeroSlide;
  size: number;
  className?: string;
}) {
  return (
    <div className={cn('skeleton-shimmer aspect-square overflow-hidden', className)}>
      <img
        key={slide.src}
        src={slide.src}
        alt={slide.alt}
        width={size}
        height={size}
        fetchPriority="high"
        decoding="async"
        className="h-full w-full object-cover animate-in fade-in duration-300 motion-reduce:animate-none"
      />
    </div>
  );
}

export function HomeHero({ variant }: { variant: 'desktop' | 'mobile' }) {
  const [active, setActive] = useState(0);
  const slide = HERO_SLIDES[active] ?? HERO_SLIDES[0]!;

  if (variant === 'mobile') {
    return (
      <section
        aria-label="Apresentação Kurio"
        className="relative overflow-hidden rounded-[30px] bg-surface-dark/70 p-5 pb-9 w-full"
      >
        {/* Background */}
        <HeroBackgroundGraphic />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="text-xs font-medium text-foreground">Bem-vindo à Kurio</span>
            <h1 className="text-xl font-bold leading-7 text-foreground">
              SEJA DONO DA
              <br />
              CULTURA DIGITAL
            </h1>
            <p className="text-xs sm:text-[15px] lg:text-base leading-5 text-text-secondary">
              Descubra NFTs selecionados de criadores do mundo todo.
            </p>
            <a
              href="#catalog"
              className="inline-flex w-fit items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              EXPLORAR <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          <div className="relative shrink-0">
            <HeroImage slide={slide} size={138} className="h-[138px] w-[138px] sm:h-[200px] sm:w-[200px] rounded-[16px] shadow-2xl" />
          </div>
        </div>

        <HeroDots active={active} onSelect={setActive} className="absolute bottom-1.5 left-1/2 -translate-x-1/2" />
      </section>
    );
  }

  return (
    <section
      aria-label="Apresentação Kurio"
      className="relative flex min-h-[450px] w-full flex-row items-center justify-between gap-10"
    >
      {/* Coluna esquerda */}
      <div className="z-10 flex h-full min-w-0 max-w-[600px] flex-1 flex-col justify-between gap-8">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium  tracking-wider text-foreground">
            Bem-vindo à Kurio
          </span>
          {/* Display/43 Bold: 43px / 56px */}
          <h1 className="whitespace-pre-line text-4xl font-bold leading-[1.25] tracking-tight text-foreground xl:text-[43px] xl:leading-[70px]">
            {'SEJA DONO DO FUTURO\nDA ARTE DIGITAL'}
          </h1>
          <p className="mt-1 max-w-[557px] text-sm leading-6 text-text-secondary">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara,
            apoie artistas e tenha uma parte da cultura da internet.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <Button
            asChild
            variant="default"
            size="lg"
            className="h-[40px] w-[140px] rounded-[6px] bg-primary text-base font-bold tracking-wider text-ink shadow-none hover:bg-[#c27c3e]"
          >
            <a href="#catalog">EXPLORAR</a>
          </Button>
          <HeroDots active={active} onSelect={setActive} className="ml-0 ml-auto" />
        </div>
      </div>

      {/* Coluna direita */}
      <HeroImage slide={slide} size={450} className="h-[450px] w-[450px] shrink-0 rounded-[24px] shadow-2xl" />
    </section>
  );
}