import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedInIcon,
  YouTubeIcon
} from '@/components/icons';

export function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="hidden lg:block w-full bg-ink text-foreground font-mono">
      {/* Top Block: 3 Value Pillars & Newsletter */}
      <div className="w-full max-w-[1200px] mx-auto bg-surface-card border-t border-border">
        <div className="mx-auto px-4 sm:px-8 py-8 lg:pr-0 lg:py-10 flex flex-col lg:flex-row items-stretch justify-between gap-6 lg:gap-0">
          {/* Pillar 1: Segurança da carteira */}
          <div className="flex-1 flex flex-col gap-2.5 px-0 lg:px-4">
            <div className="h-[74px] w-[74px] rounded-full bg-primary flex items-center justify-center text-ink text-2xl font-bold">
              W
            </div>
            <h3 className="text-[17px] font-bold text-foreground">
              Segurança da carteira
            </h3>
            <p className="text-sm text-text-secondary leading-[22px] max-w-[240px]">
              Proteja sua carteira e colecione arte digital verificada com confiança.
            </p>
          </div>

          <Separator orientation="vertical" className="hidden lg:block h-auto my-2 bg-border" />

          {/* Pillar 2: Criadores em destaque */}
          <div className="flex-1 flex flex-col gap-2.5 px-0 lg:px-6">
            <div className="h-[74px] w-[74px] rounded-full bg-primary flex items-center justify-center text-ink text-2xl font-bold">
              C
            </div>
            <h3 className="text-[17px] font-bold text-foreground">
              Criadores em destaque
            </h3>
            <p className="text-sm text-text-secondary leading-[22px] max-w-[240px]">
              Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.
            </p>
          </div>

          <Separator orientation="vertical" className="hidden lg:block h-auto my-2 bg-border" />

          {/* Pillar 3: Alertas de lançamentos */}
          <div className="flex-1 flex flex-col gap-2.5 px-0 lg:px-6">
            <div className="h-[74px] w-[74px] rounded-full bg-primary flex items-center justify-center text-ink text-2xl font-bold">
              D
            </div>
            <h3 className="text-[17px] font-bold text-foreground">
              Alertas de lançamentos
            </h3>
            <p className="text-sm text-text-secondary leading-[22px] max-w-[240px]">
              Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.
            </p>
          </div>

          <Separator orientation="vertical" className="hidden lg:block h-auto my-2 bg-border" />

          {/* Pillar 4: Newsletter Form */}
          <div className="flex-1 lg:max-w-[440px] xl:min-w-[350px] flex flex-col gap-3 px-0 lg:px-6">
            <h3 className="text-lg font-bold text-foreground leading-4">
              Antecipe-se ao próximo lançamento
            </h3>

            <form onSubmit={handleSubscribe} className="flex flex-col gap-2 mt-1">
              <div className="flex items-center h-10 rounded-[6px] bg-surface-dark shadow-[0_0_20px_0_rgba(10,6,4,0.45)] overflow-hidden">
                <Input
                  type="email"
                  required
                  placeholder="digite seu e-mail..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 h-full border-0 bg-transparent px-3 text-sm text-foreground placeholder:text-text-secondary/60 focus-visible:ring-0 shadow-none"
                  aria-label="E-mail para newsletter"
                />
                <Button
                  type="submit"
                  variant="default"
                  className="h-full w-[85px] bg-primary text-ink text-lg font-bold flex items-center justify-center shrink-0 rounded-none rounded-r-[6px] hover:bg-[#c27c3e] shadow-none"
                >
                  {subscribed ? '✓' : 'Enviar'}
                </Button>
              </div>

              <p className="text-[13px] text-text-secondary leading-[22px] mt-1">
                Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Middle Block: Contact Bar */}
      <div className="max-w-[1200px] mx-auto bg-surface-dark border-y border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 py-4 lg:py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 text-sm items-center">
          <Link to="/" className="text-sm font-bold tracking-[0.1em] text-foreground uppercase">
            KURIO
          </Link>

          <span className="text-foreground text-center md:text-left leading-[22px]">
            Feito para colecionadores,<br className="hidden sm:inline" /> criadores e cultura
          </span>

          <a
            href="mailto:contato@email.com"
            className="text-foreground hover:text-primary transition-colors leading-[22px]"
          >
            contato@email.com
          </a>

          <span className="text-foreground leading-[22px]">
            +55 11 4002 8922
          </span>
        </div>
      </div>

      {/* Directory Navigation */}
      <div className="max-w-[1200px] mx-auto bg-surface-card">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 py-10 lg:py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 text-sm">
          {/* Col 1: Meu perfil */}
          <div className="flex flex-col gap-4">
            <h4 className="text-lg font-bold text-foreground">Meu perfil</h4>
            <nav className="flex flex-col gap-1.5 text-foreground leading-[30px]" aria-label="Links do Perfil">
              <Link to="/profile" className="hover:text-text-accent transition-colors">
                Meu perfil
              </Link>
              <Link to="/profile" className="hover:text-text-accent transition-colors">
                Minha coleção
              </Link>
              <Link to="/profile" className="hover:text-text-accent transition-colors">
                Atividade
              </Link>
              <a href="#promos" className="hover:text-text-accent transition-colors">
                Estúdio do criador
              </a>
              <Link to="/cart" className="hover:text-text-accent transition-colors">
                Lista de interesse
              </Link>
            </nav>
          </div>

          {/* Col 2: Central de ajuda */}
          <div className="flex flex-col gap-4">
            <h4 className="text-lg font-bold text-foreground">Central de ajuda</h4>
            <nav className="flex flex-col gap-1.5 text-foreground leading-[30px]" aria-label="Links de Ajuda">
              <a href="#blog" className="hover:text-text-accent transition-colors">
                Central de ajuda
              </a>
              <a href="#blog" className="hover:text-text-accent transition-colors">
                Como comprar NFTs
              </a>
              <Link to="/wallets" className="hover:text-text-accent transition-colors">
                Carteira e segurança
              </Link>
              <a href="#catalog" className="hover:text-text-accent transition-colors">
                Política do mercado
              </a>
              <a href="mailto:contato@email.com" className="hover:text-text-accent transition-colors">
                Denunciar item
              </a>
            </nav>
          </div>

          {/* Col 3: Coleções */}
          <div className="flex flex-col gap-4">
            <h4 className="text-lg font-bold text-foreground">Coleções</h4>
            <nav className="flex flex-col gap-1.5 text-foreground leading-[30px]" aria-label="Categorias de Coleções">
              <a href="#catalog" className="hover:text-text-accent transition-colors">
                Arte digital
              </a>
              <a href="#catalog" className="hover:text-text-accent transition-colors">
                Fotografia
              </a>
              <a href="#catalog" className="hover:text-text-accent transition-colors">
                Música
              </a>
              <a href="#catalog" className="hover:text-text-accent transition-colors">
                Arte 3D
              </a>
              <a href="#catalog" className="hover:text-text-accent transition-colors">
                Utilidade
              </a>
            </nav>
          </div>

          {/* Col 4: Redes sociais & Carteiras compatíveis */}
          <div className="flex flex-col gap-7">
            <div className="flex flex-col gap-3">
              <h4 className="text-lg font-bold text-foreground">Redes sociais</h4>
              <div className="flex items-center gap-2">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="h-[30px] w-[30px] rounded-[4px] border border-primary flex items-center justify-center text-primary hover:bg-primary/10 transition-colors text-xs font-bold"
                  aria-label="Facebook"
                >
                  <FacebookIcon width={8} height={16} />
                </a>
                <a
                  href="mailto:contato@email.com"
                  className="h-[30px] w-[30px] rounded-[4px] border border-primary flex items-center justify-center text-primary hover:bg-primary/10 transition-colors text-xs"
                  aria-label="Email"
                >
                  <InstagramIcon width={16} height={16} />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  className="h-[30px] w-[30px] rounded-[4px] border border-primary flex items-center justify-center text-primary hover:bg-primary/10 transition-colors text-xs font-bold"
                  aria-label="Twitter / X"
                >
                  <TwitterIcon width={16} height={13} />

                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="h-[30px] w-[30px] rounded-[4px] border border-primary flex items-center justify-center text-primary hover:bg-primary/10 transition-colors text-xs font-bold"
                  aria-label="LinkedIn"
                >
                  <LinkedInIcon width={16} height={16} />

                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="h-[30px] w-[30px] rounded-[4px] border border-primary flex items-center justify-center text-primary hover:bg-primary/10 transition-colors text-xs font-bold"
                  aria-label="YouTube"
                >
                  <YouTubeIcon width={19} height={14} />

                </a>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-lg font-bold text-foreground">Carteiras compatíveis</h4>
              <div className="h-[26px] rounded-[6px] border border-border-soft bg-surface-dark px-3 flex items-center justify-center text-[9px] font-bold text-text-accent tracking-wider">
                METAMASK  •  WALLETCONNECT  •  COINBASE
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="py-6 text-center text-sm text-foreground bg-ink">
        <p>© 2026 Kurio. Propriedade digital para todos.</p>
      </div>
    </footer>
  );
}