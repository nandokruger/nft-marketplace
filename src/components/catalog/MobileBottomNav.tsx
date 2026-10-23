import { useRef, useState, useEffect } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useCurrentUser, useCartItemCount } from '@/lib/use-session';
import { useAuthModal } from '@/context/AuthModalContext';
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
        setDimensions({
          width: Math.round(rect.width),
          height: Math.round(rect.height) || 76
        });
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
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
            <svg width="27" height="24" viewBox="0 0 27 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.3819 12.8913C9.28498 12.8913 5.18803 12.8913 1.09108 12.8906C0.961448 12.8906 0.827342 12.8943 0.702176 12.8667C0.25441 12.7684 -0.0480741 12.337 0.00631347 11.893C0.060701 11.4482 0.439924 11.1114 0.913021 11.1092C1.98364 11.1032 3.055 11.1062 4.12561 11.1062C11.3234 11.1062 18.5212 11.107 25.719 11.1084C25.8575 11.1084 26.0013 11.1047 26.1347 11.136C26.5743 11.2396 26.8641 11.6553 26.8179 12.0919C26.7702 12.5389 26.3947 12.8868 25.9246 12.8891C24.7139 12.8965 23.504 12.8928 22.2933 12.8928C19.3228 12.8928 16.3524 12.8928 13.3827 12.8928C13.3819 12.8928 13.3819 12.8921 13.3819 12.8913Z" fill="#F5F1EB" />
              <path d="M10.5553 24.0002C9.20453 23.7976 7.81951 23.7216 6.51123 23.3654C3.76503 22.6167 2.19524 20.7243 1.7445 17.9274C1.57761 16.8926 1.47479 15.8473 1.35559 14.8057C1.28332 14.1762 1.58357 13.7634 2.13191 13.6956C2.67653 13.6286 3.07587 13.9817 3.13622 14.5278C3.26586 15.708 3.35601 16.8978 3.57877 18.0615C3.98109 20.1633 5.70212 21.6288 7.83664 21.8165C8.84617 21.9052 9.8542 22.0177 10.8607 22.1339C11.5953 22.2188 11.9343 23.0347 11.4948 23.6314C11.3048 23.89 11.0805 23.9637 10.5553 24.0002Z" fill="#F5F1EB" />
              <path d="M25.4463 9.39819C25.4307 9.53528 25.4321 9.67758 25.3949 9.8087C25.3077 10.1186 25.0015 10.3779 24.7422 10.3831C24.3004 10.3921 23.7998 10.0643 23.6977 9.65001C23.6247 9.35572 23.6225 9.0443 23.5822 8.74107C23.4571 7.78444 23.3967 6.81366 23.1881 5.87566C22.7604 3.95571 21.5326 2.73758 19.6142 2.32259C18.4743 2.07599 17.2971 1.99999 16.1363 1.84726C16.0075 1.83013 15.8756 1.82417 15.7504 1.79213C15.331 1.68559 15.0583 1.287 15.1112 0.870521C15.17 0.407854 15.5269 0.0539627 15.9732 0.0859992C17.5042 0.195519 19.0427 0.30653 20.5119 0.776646C22.8633 1.52988 24.3451 3.15778 24.9054 5.53965C25.2012 6.79876 25.3018 8.10332 25.4903 9.38701C25.4761 9.39148 25.4612 9.39446 25.4463 9.39819Z" fill="#F5F1EB" />
              <path d="M25.4224 14.8807C25.2988 16.1673 25.2086 17.5807 24.8167 18.9441C24.0777 21.5145 21.8962 23.2891 19.2372 23.5491C18.1554 23.6549 17.0781 23.8106 15.9992 23.944C15.617 23.9917 15.2013 23.6229 15.1208 23.1647C15.0404 22.7058 15.3287 22.255 15.7832 22.1939C16.3263 22.1202 16.8776 22.106 17.4208 22.033C18.3223 21.913 19.2565 21.8803 20.1133 21.6083C21.97 21.0197 23.007 19.6638 23.279 17.7453C23.4235 16.7254 23.5308 15.7002 23.6336 14.675C23.6932 14.082 24.0799 13.6685 24.6007 13.6983C25.1043 13.7273 25.4515 14.1744 25.4224 14.8807Z" fill="#F5F1EB" />
              <path d="M1.3295 9.27513C1.52768 7.95493 1.62081 6.60791 1.9449 5.319C2.60053 2.71063 4.34912 1.11849 6.95898 0.532893C8.1339 0.269151 9.34756 0.177512 10.5448 0.0173291C10.7266 -0.00725703 10.9226 -0.0087471 11.0984 0.0329749C11.5119 0.130574 11.7548 0.509797 11.7153 0.940427C11.6736 1.39117 11.3681 1.69068 10.9285 1.73985C9.84748 1.86055 8.7642 1.97081 7.68688 2.1228C5.4108 2.44316 3.83356 4.02338 3.52363 6.28456C3.37536 7.36933 3.2569 8.45857 3.1295 9.54632C3.07809 9.98441 2.70185 10.3122 2.24217 10.3063C1.79589 10.3003 1.41518 9.94492 1.39059 9.50833C1.38612 9.43457 1.38985 9.36007 1.38985 9.28556C1.36973 9.28184 1.34961 9.27886 1.3295 9.27513Z" fill="#F5F1EB" />
            </svg>
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
            <svg width="18" height="19" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.52898 15.6445V13.0963C5.52898 12.4459 6.06014 11.9186 6.71536 11.9186H9.11051C9.42516 11.9186 9.72692 12.0427 9.94941 12.2635C10.1719 12.4844 10.2969 12.784 10.2969 13.0963V15.6445C10.2949 15.9149 10.4017 16.1749 10.5936 16.3668C10.7856 16.5587 11.0467 16.6667 11.3191 16.6667H12.9532C13.7164 16.6686 14.449 16.369 14.9893 15.834C15.5297 15.299 15.8333 14.5725 15.8333 13.8149V6.55572C15.8333 5.94372 15.5601 5.3632 15.0872 4.97056L9.52835 0.563224C8.56138 -0.209532 7.17593 -0.184582 6.23783 0.622482L0.805844 4.97056C0.310617 5.35163 0.0146269 5.93386 0 6.55572V13.8074C0 15.3865 1.28948 16.6667 2.88014 16.6667H4.47691C5.04269 16.6667 5.5025 16.2135 5.5066 15.6519L5.52898 15.6445Z"
                fill={isHome ? '#E89B55' : '#CFB28C'}
              />
            </svg>
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
            <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18.4134 1.74133C17.3781 0.618439 15.9575 0 14.413 0C13.2585 0 12.2012 0.36499 11.2704 1.08475C10.8008 1.44806 10.3752 1.89255 10 2.41135C9.62494 1.8927 9.19922 1.44806 8.7294 1.08475C7.79877 0.36499 6.74149 0 5.58701 0C4.04251 0 2.62177 0.618439 1.58646 1.74133C0.563507 2.8511 0 4.36722 0 6.01059C0 7.70203 0.630341 9.25034 1.98364 10.8833C3.19427 12.3441 4.93423 13.8269 6.94916 15.544C7.63718 16.1304 8.41705 16.795 9.22684 17.5031C9.44077 17.6904 9.71527 17.7936 10 17.7936C10.2846 17.7936 10.5592 17.6904 10.7729 17.5034C11.5826 16.7952 12.363 16.1302 13.0513 15.5435C15.0659 13.8268 16.8059 12.3441 18.0165 10.8832C19.3698 9.25034 20 7.70203 20 6.01044C20 4.36722 19.4365 2.8511 18.4134 1.74133Z"
                fill={isFavorites ? '#F0805F' : '#CFB28C'}
              />
            </svg>
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
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18.3333 6.80118L17.3897 12.7776C17.2181 13.9561 16.2745 14.7136 15.0735 14.7136H6.83825C5.72305 14.7136 4.69364 13.8719 4.52207 12.7776L3.49266 5.79108L3.2353 3.85506C3.14952 3.35001 2.7206 3.01331 2.12011 3.01331H1.51962C1.17648 3.01331 0.833344 2.6766 0.833344 2.3399C0.833344 2.0032 1.17648 1.6665 1.51962 1.6665H2.12011C3.32109 1.6665 4.3505 2.50825 4.43628 3.68671L4.60785 5.03351H16.7892C17.2181 5.03351 17.6471 5.20186 17.9044 5.53856C18.2476 5.87526 18.3333 6.38031 18.3333 6.80118Z"
                fill={isCart ? '#E89B55' : '#CFB28C'}
              />
              <path
                d="M15.2451 18.3332C15.7189 18.3332 16.103 17.9563 16.103 17.4914C16.103 17.0265 15.7189 16.6497 15.2451 16.6497C14.7713 16.6497 14.3873 17.0265 14.3873 17.4914C14.3873 17.9563 14.7713 18.3332 15.2451 18.3332Z"
                fill={isCart ? '#E89B55' : '#CFB28C'}
              />
              <path
                d="M6.66668 18.3332C7.14045 18.3332 7.52452 17.9563 7.52452 17.4914C7.52452 17.0265 7.14045 16.6497 6.66668 16.6497C6.1929 16.6497 5.80883 17.0265 5.80883 17.4914C5.80883 17.9563 6.1929 18.3332 6.66668 18.3332Z"
                fill={isCart ? '#E89B55' : '#CFB28C'}
              />
            </svg>

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
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M10.0001 9.82977C12.2659 9.82977 14.1026 8.00236 14.1026 5.74814C14.1026 3.49391 12.2659 1.6665 10.0001 1.6665C7.73429 1.6665 5.89751 3.49391 5.89751 5.74814C5.89751 8.00236 7.73429 9.82977 10.0001 9.82977Z"
                  fill={isProfile ? '#E89B55' : '#CFB28C'}
                />
                <path
                  d="M12.1368 11.5305H7.86332C5.38469 11.5305 3.3334 13.5713 3.3334 16.0373C3.3334 16.6326 3.58981 17.1428 4.10264 17.3979C4.87187 17.823 6.58127 18.3332 10.0001 18.3332C13.4189 18.3332 15.1283 17.823 15.8975 17.3979C16.3249 17.1428 16.6667 16.6326 16.6667 16.0373C16.6667 13.4863 14.6155 11.5305 12.1368 11.5305Z"
                  fill={isProfile ? '#E89B55' : '#CFB28C'}
                />
              </svg>
              <span className="sr-only">Perfil</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openLogin('/profile')}
              aria-label="Entrar no perfil"
              className="flex flex-col items-center justify-center p-2 min-h-[48px] min-w-[48px] active:scale-95 transition-transform text-text-secondary hover:text-foreground cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M10.0001 9.82977C12.2659 9.82977 14.1026 8.00236 14.1026 5.74814C14.1026 3.49391 12.2659 1.6665 10.0001 1.6665C7.73429 1.6665 5.89751 3.49391 5.89751 5.74814C5.89751 8.00236 7.73429 9.82977 10.0001 9.82977Z"
                  fill="#CFB28C"
                />
                <path
                  d="M12.1368 11.5305H7.86332C5.38469 11.5305 3.3334 13.5713 3.3334 16.0373C3.3334 16.6326 3.58981 17.1428 4.10264 17.3979C4.87187 17.823 6.58127 18.3332 10.0001 18.3332C13.4189 18.3332 15.1283 17.823 15.8975 17.3979C16.3249 17.1428 16.6667 16.6326 16.6667 16.0373C16.6667 13.4863 14.6155 11.5305 12.1368 11.5305Z"
                  fill="#CFB28C"
                />
              </svg>
              <span className="sr-only">Entrar</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
