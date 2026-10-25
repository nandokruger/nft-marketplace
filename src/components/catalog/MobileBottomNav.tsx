import { useRef, useState, useEffect } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useCurrentUser, useCartItemCount } from '@/lib/use-session';
import { useAuthModal } from '@/context/AuthModalContext';
import {
  CameraScanIcon,
  HomeNavIcon,
  FavoritesNavIcon,
  CartItemIcon,
  UserNavIcon
} from '@/components/icons';
import type { CatalogSearch } from '@/components/catalog/catalog-search';

interface MobileBottomNavProps {
  search?: CatalogSearch | undefined;
  onFilterFavorites?: () => void;
  onClearFavorites?: () => void;
}

/**
 * Builds the SVG path for the mobile bottom nav silhouette with a smooth concave cradle (notch)
 * embracing the central floating action button.
 */
function buildNotchPath(w: number, h: number, rCorner = 30, notchDepth = 42, notchHalfWidth = 54) {
  const c = w / 2;
  const curveLeft = `C ${c - 40} 0, ${c - 35} 12, ${c - 28} 26 C ${c - 20} 40, ${c - 12} ${notchDepth}, ${c} ${notchDepth}`;
  const curveRight = `C ${c + 12} ${notchDepth}, ${c + 20} 40, ${c + 28} 26 C ${c + 35} 12, ${c + 40} 0, ${c + notchHalfWidth} 0`;

  return `M 0 ${h} L 0 ${rCorner} Q 0 0 ${rCorner} 0 L ${c - notchHalfWidth} 0 ${curveLeft} ${curveRight} L ${w - rCorner} 0 Q ${w} 0 ${w} ${rCorner} L ${w} ${h} Z`;
}

/**
 * Builds the SVG stroke path for only the upper curved contour of the bar.
 */
function buildNotchStroke(w: number, rCorner = 30, notchDepth = 42, notchHalfWidth = 54) {
  const c = w / 2;
  const curveLeft = `C ${c - 40} 0, ${c - 35} 12, ${c - 28} 26 C ${c - 20} 40, ${c - 12} ${notchDepth}, ${c} ${notchDepth}`;
  const curveRight = `C ${c + 12} ${notchDepth}, ${c + 20} 40, ${c + 28} 26 C ${c + 35} 12, ${c + 40} 0, ${c + notchHalfWidth} 0`;

  return `M 0 ${rCorner + 12} L 0 ${rCorner} Q 0 0 ${rCorner} 0 L ${c - notchHalfWidth} 0 ${curveLeft} ${curveRight} L ${w - rCorner} 0 Q ${w} 0 ${w} ${rCorner} L ${w} ${rCorner + 12}`;
}

export function MobileBottomNav({
  search,
  onFilterFavorites,
  onClearFavorites
}: MobileBottomNavProps) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const currentUser = useCurrentUser();
  const cartCount = useCartItemCount(currentUser);
  const { openLogin } = useAuthModal();

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 390,
    height: 76
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        const nextW = Math.round(rect.width);
        const nextH = Math.round(rect.height) || 76;
        setDimensions((prev) =>
          prev.width === nextW && prev.height === nextH ? prev : { width: nextW, height: nextH }
        );
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      ro.disconnect();
    };
  }, []);

  const isHome = pathname === '/' && search?.favorites !== '1';
  const isFavorites = pathname === '/' && search?.favorites === '1';
  const isCart = pathname.startsWith('/cart');
  const isProfile = pathname.startsWith('/profile');

  const handleFavoritesClick = (e: React.MouseEvent) => {
    if (onFilterFavorites) {
      e.preventDefault();
      if (isFavorites && onClearFavorites) {
        onClearFavorites();
      } else {
        onFilterFavorites();
      }
    }
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    if (isFavorites && onClearFavorites) {
      e.preventDefault();
      onClearFavorites();
    }
  };

  const { width, height } = dimensions;

  return (
    <nav
      aria-label="Navegação inferior móvel"
      className="fixed inset-x-0 bottom-0 z-50 lg:hidden pointer-events-none overflow-visible"
    >
      <div
        ref={containerRef}
        className="relative w-full pointer-events-auto"
      >
        {/* SVG curved silhouette background */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible filter drop-shadow-[0_-4px_16px_rgba(0,0,0,0.5)]"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={buildNotchPath(width, height)} fill="#1A120E" />
          <path
            d={buildNotchStroke(width)}
            fill="none"
            stroke="#3F2319"
            strokeWidth="0"
            strokeLinecap="round"
          />
        </svg>

        {/* Central Floating Action Button (FAB - Scanner/Wallet) nested within the notch cradle */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-20">
          <button
            type="button"
            onClick={() => {
              if (!currentUser) openLogin('/profile');
            }}
            aria-label="Escanear QR Code ou conectar carteira"
            className="h-14 w-14 rounded-full bg-gradient-to-tr from-[#D28A4C]/[0.28] to-[#D28A4C]/80 text-[#F5F1EB] flex items-center justify-center shadow-lg shadow-amber-900/40 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            {/* Camera / Scanner Icon */}
            <CameraScanIcon width={27} height={24} className="text-[#F5F1EB]" />
          </button>
        </div>

        {/* 5-item horizontal navigation grid */}
        <div className="relative z-10 flex items-center justify-around w-full max-w-md mx-auto pt-2 pb-[env(safe-area-inset-bottom,16px)] min-h-[72px]">
          {/* 1. Início */}
          <Link
            to="/"
            onClick={handleHomeClick}
            aria-label="Início"
            className={`flex flex-col items-center justify-center p-2 min-h-[48px] min-w-[48px] active:scale-95 transition-transform ${isHome ? 'text-primary' : 'text-text-secondary hover:text-foreground'
              }`}
          >
            <HomeNavIcon className={isHome ? 'text-[#E89B55]' : 'text-[#CFB28C]'} />
            <span className="sr-only">Início</span>
          </Link>

          {/* 2. Favoritos */}
          <button
            type="button"
            onClick={handleFavoritesClick}
            aria-label="Favoritos"
            className={`flex flex-col items-center justify-center p-2 min-h-[48px] min-w-[48px] active:scale-95 transition-transform cursor-pointer ${isFavorites ? 'text-text-coral' : 'text-text-secondary hover:text-foreground'
              }`}
          >
            <FavoritesNavIcon className={isFavorites ? 'text-[#F0805F]' : 'text-[#CFB28C]'} />
            <span className="sr-only">Favoritos</span>
          </button>

          {/* 3. Espaçador Central dedicado para a projeção do FAB */}
          <div className="w-14 h-12 pointer-events-none" aria-hidden="true" />

          {/* 4. Carrinho */}
          <Link
            to="/cart"
            aria-label={`Carrinho com ${cartCount} itens`}
            className={`relative flex flex-col items-center justify-center p-2 min-h-[48px] min-w-[48px] active:scale-95 transition-transform ${isCart ? 'text-primary' : 'text-text-secondary hover:text-foreground'
              }`}
          >
            <CartItemIcon className={isCart ? 'text-[#E89B55]' : 'text-[#CFB28C]'} />

            {cartCount > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-primary text-ink font-bold text-[10px] flex items-center justify-center ring-2 ring-[#1A120E]">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
            <span className="sr-only">Carrinho</span>
          </Link>

          {/* 5. Perfil / Login */}
          {currentUser ? (
            <Link
              to="/profile"
              aria-label="Perfil do usuário"
              className={`flex flex-col items-center justify-center p-2 min-h-[48px] min-w-[48px] active:scale-95 transition-transform ${isProfile ? 'text-primary' : 'text-text-secondary hover:text-foreground'
                }`}
            >
              <UserNavIcon className={isProfile ? 'text-[#E89B55]' : 'text-[#CFB28C]'} />
              <span className="sr-only">Perfil</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openLogin('/profile')}
              aria-label="Entrar no perfil"
              className="flex flex-col items-center justify-center p-2 min-h-[48px] min-w-[48px] active:scale-95 transition-transform text-text-secondary hover:text-foreground cursor-pointer"
            >
              <UserNavIcon className="text-[#CFB28C]" />
              <span className="sr-only">Entrar</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}