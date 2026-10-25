import { useState, useEffect } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient, AUTH_USER_KEY } from '@/lib/axios';
import { queryKeys } from '@/lib/query-keys';
import { wipeSessionState } from '@/lib/query-client';
import { Button } from '@/components/ui/button';
import { useAuthModal } from '@/context/AuthModalContext';
import { useIsDesktop } from '@/lib/use-media-query';
import { resolveAssetUrl } from '@/lib/assets';
import {
  SearchIcon,
  CartNavIcon,
  LoginIcon,
  MenuIcon,
  CloseIcon
} from '@/components/icons';
import type { Cart, User } from '@/contracts';

export function Header() {
  const isDesktop = useIsDesktop();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { openLogin } = useAuthModal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const checkUser = () => {
      try {
        const raw = window.localStorage.getItem(AUTH_USER_KEY);
        if (raw) {
          setCurrentUser(JSON.parse(raw));
        } else {
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      }
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    window.addEventListener('kurio:auth-changed', checkUser);
    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('kurio:auth-changed', checkUser);
    };
  }, []);

  const cartKey = currentUser ? currentUser.id : 'guest';
  const { data: cart } = useQuery<Cart>({
    queryKey: queryKeys.user.cart(cartKey),
    queryFn: async () => {
      const res = await apiClient.get<Cart>('/api/cart');
      return res.data;
    }
  });

  const cartItemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleLogout = () => {
    wipeSessionState();
    window.dispatchEvent(new CustomEvent('kurio:auth-changed'));
    window.location.href = '/';
  };


  if (!isDesktop) return null;

  return (
    <header className="sticky max-w-[1200px] mx-auto top-0 z-40 w-full border-b border-primary/30 bg-ink/95 backdrop-blur-md">
      <div className="mx-auto flex h-[55px] mt-2 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-4 lg:gap-10">
          <Link
            to="/"
            className="flex items-center text-sm font-bold tracking-[0.1em] text-foreground hover:opacity-90 font-mono uppercase"
            aria-label="KURIO NFT Marketplace - Início"
          >
            <span>KURIO</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-10 text-base" aria-label="Navegação principal">
          <Link
            to="/"
            className={`relative py-3 transition-colors ${currentPath === '/' ? 'text-text-accent font-bold' : 'text-foreground hover:text-text-accent font-normal'
              }`}
          >
            Início
            {currentPath === '/' && (
              <span
                className="absolute bottom-[-3px] left-0 h-[3px] w-full bg-primary"
                aria-hidden="true"
              />
            )}
          </Link>

          <Link
            to="/"
            className={`relative py-5 transition-colors ${currentPath.startsWith('/nft') || currentPath.startsWith('/cart') || currentPath.startsWith('/checkout')
              ? 'text-text-accent font-bold'
              : 'text-foreground hover:text-text-accent font-normal'
              }`}
          >
            Mercado
            {(currentPath.startsWith('/nft') || currentPath.startsWith('/cart') || currentPath.startsWith('/checkout')) && (
              <span
                className="absolute bottom-[3px] left-0 h-[3px] w-full bg-primary"
                aria-hidden="true"
              />
            )}
          </Link>

          <a
            href="#promos"
            className="py-3 text-foreground hover:text-text-accent font-normal transition-colors cursor-pointer"
          >
            Criadores
          </a>

          <a
            href="#blog"
            className="py-5 text-foreground hover:text-text-accent font-normal transition-colors cursor-pointer"
          >
            Aprenda
          </a>

        </nav>

        {/* Right Header Actions: Search, Cart Icon with Badge, Login Button */}
        <div className="flex items-center gap-7">
          {/* Quick Search trigger icon */}
          <a
            href="#catalog"
            className="text-foreground hover:text-primary transition-colors p-1"
            aria-label="Buscar no catálogo"
          >
            <SearchIcon width={20} height={20} />
          </a>

          {/* Cart Icon */}
          <Link
            to="/cart"
            className="relative flex items-center justify-center p-1 text-foreground hover:text-primary transition-colors cursor-pointer"
            aria-label={`Carrinho com ${cartItemCount} itens`}
          >
            <CartNavIcon width={24} height={24} />
            <span
              className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-ink border-[2px] border-ink"
              aria-hidden="true"
            >
              {cartItemCount}
            </span>
          </Link>

          {/* Login Button */}
          <div className="hidden sm:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-xs text-text-secondary hover:text-foreground"
                >
                  <img
                    src={resolveAssetUrl(currentUser.avatarUrl)}
                    alt={currentUser.name}
                    className="h-8 w-8 rounded-full border border-primary/50 object-cover"
                  />
                  <span className="font-bold max-w-[100px] truncate">{currentUser.name}</span>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs text-text-secondary hover:text-text-coral hover:border-text-coral"
                  aria-label="Encerrar sessão"
                >
                  Sair
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => openLogin()}
                className="h-[35px] w-[100px] gap-0.5 rounded-[6px] font-medium text-base text-ink bg-primary hover:bg-[#c27c3e] cursor-pointer shadow-none"
              >
                <LoginIcon width={20} height={20} className="shrink-0" />
                <span>Entrar</span>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-[5px] border border-border bg-surface-card text-foreground hover:border-primary"
            aria-label={mobileMenuOpen ? 'Fechar menu móvel' : 'Abrir menu móvel'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <CloseIcon className="h-5 w-5" />
            ) : (
              <MenuIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-surface-dark px-4 py-6 shadow-xl">
          <nav className="flex flex-col gap-4" aria-label="Navegação móvel">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-base text-text-accent font-bold"
            >
              Início
            </Link>
            <a
              href="#catalog"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-base text-foreground"
            >
              Mercado
            </a>
            <a
              href="#promos"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-base text-foreground"
            >
              Criadores
            </a>
            <a
              href="#blog"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-base text-foreground"
            >
              Aprenda
            </a>

            <div className="pt-4 border-t border-border flex flex-col gap-3">
              {currentUser ? (
                <>
                  <div className="flex items-center gap-3">
                    <img
                      src={resolveAssetUrl(currentUser.avatarUrl)}
                      alt={currentUser.name}
                      className="h-9 w-9 rounded-full border border-primary object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold text-foreground">{currentUser.name}</p>
                      <p className="text-xs text-text-secondary">{currentUser.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-text-coral border-text-coral/50"
                  >
                    Encerrar Sessão
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openLogin();
                  }}
                  className="w-full"
                >
                  Entrar na Conta
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}