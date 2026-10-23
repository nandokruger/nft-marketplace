import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

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
                  <svg width="8" height="16" viewBox="0 0 8 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 5.33333H0V8H2V16H5.33333V8H7.73333L8 5.33333H5.33333V4.2C5.33333 3.6 5.46667 3.33333 6.06667 3.33333H8V0H5.46667C3.06667 0 2 1.06667 2 3.06667V5.33333Z" fill="#D28A4C" />
                  </svg>
                </a>
                <a
                  href="mailto:contato@email.com"
                  className="h-[30px] w-[30px] rounded-[4px] border border-primary flex items-center justify-center text-primary hover:bg-primary/10 transition-colors text-xs"
                  aria-label="Email"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 1.46667C10.1333 1.46667 10.4 1.46667 11.2667 1.53333C13.4667 1.6 14.4667 2.66667 14.5333 4.8C14.6 5.66667 14.6 5.86667 14.6 8C14.6 10.1333 14.6 10.4 14.5333 11.2C14.4667 13.3333 13.4 14.4 11.2667 14.4667C10.4 14.5333 10.2 14.5333 8 14.5333C5.86667 14.5333 5.6 14.5333 4.8 14.4667C2.6 14.4 1.6 13.3333 1.53333 11.2C1.46667 10.3333 1.46667 10.1333 1.46667 8C1.46667 5.86667 1.46667 5.6 1.53333 4.8C1.6 2.66667 2.66667 1.6 4.8 1.53333C5.6 1.46667 5.86667 1.46667 8 1.46667ZM8 0C5.8 0 5.53333 0 4.73333 0.0666667C1.8 0.2 0.2 1.8 0.0666667 4.73333C0 5.53333 0 5.8 0 8C0 10.2 0 10.4667 0.0666667 11.2667C0.2 14.2 1.8 15.8 4.73333 15.9333C5.53333 16 5.8 16 8 16C10.2 16 10.4667 16 11.2667 15.9333C14.2 15.8 15.8 14.2 15.9333 11.2667C16 10.4667 16 10.2 16 8C16 5.8 16 5.53333 15.9333 4.73333C15.8 1.8 14.2 0.2 11.2667 0.0666667C10.4667 0 10.2 0 8 0ZM8 3.86667C5.73333 3.86667 3.86667 5.73333 3.86667 8C3.86667 10.2667 5.73333 12.1333 8 12.1333C10.2667 12.1333 12.1333 10.2667 12.1333 8C12.1333 5.73333 10.2667 3.86667 8 3.86667ZM8 10.6667C6.53333 10.6667 5.33333 9.46667 5.33333 8C5.33333 6.53333 6.53333 5.33333 8 5.33333C9.46667 5.33333 10.6667 6.53333 10.6667 8C10.6667 9.46667 9.46667 10.6667 8 10.6667ZM12.2667 2.8C11.7333 2.8 11.3333 3.2 11.3333 3.73333C11.3333 4.26667 11.7333 4.66667 12.2667 4.66667C12.8 4.66667 13.2 4.26667 13.2 3.73333C13.2 3.2 12.8 2.8 12.2667 2.8Z" fill="#D28A4C" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  className="h-[30px] w-[30px] rounded-[4px] border border-primary flex items-center justify-center text-primary hover:bg-primary/10 transition-colors text-xs font-bold"
                  aria-label="Twitter / X"
                >
                  <svg width="16" height="13" viewBox="0 0 16 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.03186 13.0036C11.0699 13.0036 14.3718 8.00118 14.3718 3.66357C14.3718 3.52144 14.3689 3.38005 14.3624 3.2392C15.0033 2.77588 15.5605 2.19756 16 1.53953C15.4118 1.80085 14.7789 1.97682 14.1149 2.05616C14.7926 1.64981 15.313 1.0067 15.5585 0.24021C14.9241 0.616357 14.2217 0.889688 13.4742 1.03709C12.8749 0.399076 12.0218 0 11.0779 0C9.26483 0 7.79464 1.4702 7.79464 3.28233C7.79464 3.54001 7.82357 3.79041 7.87962 4.0308C5.1516 3.89377 2.73239 2.58735 1.11352 0.601253C0.831273 1.08622 0.668767 1.64999 0.668767 2.25106C0.668767 3.38988 1.24837 4.3953 2.12968 4.98363C1.59121 4.96707 1.08531 4.81894 0.642926 4.57291C0.642198 4.58656 0.642198 4.60039 0.642198 4.61476C0.642198 6.2047 1.77392 7.53204 3.27578 7.83285C3.00008 7.90801 2.71001 7.94841 2.41047 7.94841C2.19901 7.94841 1.99338 7.9273 1.79339 7.88927C2.21121 9.19332 3.42318 10.1425 4.86007 10.1693C3.73636 11.0499 2.32094 11.5745 0.783049 11.5745C0.518272 11.5745 0.256952 11.5594 0 11.529C1.45273 12.46 3.17769 13.0036 5.03186 13.0036Z" fill="#D28A4C" />
                  </svg>

                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="h-[30px] w-[30px] rounded-[4px] border border-primary flex items-center justify-center text-primary hover:bg-primary/10 transition-colors text-xs font-bold"
                  aria-label="LinkedIn"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.33333 1.66667C3.33333 2.6 2.6 3.33333 1.66667 3.33333C0.733333 3.33333 0 2.6 0 1.66667C0 0.733333 0.733333 0 1.66667 0C2.6 0 3.33333 0.733333 3.33333 1.66667ZM3.33333 4.66667H0V15.3333H3.33333V4.66667ZM8.66667 4.66667H5.33333V15.3333H8.66667V9.73333C8.66667 6.6 12.6667 6.33333 12.6667 9.73333V15.3333H16V8.6C16 3.33333 10.0667 3.53333 8.66667 6.13333V4.66667Z" fill="#D28A4C" />
                  </svg>

                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="h-[30px] w-[30px] rounded-[4px] border border-primary flex items-center justify-center text-primary hover:bg-primary/10 transition-colors text-xs font-bold"
                  aria-label="YouTube"
                >
                  <svg width="19" height="14" viewBox="0 0 19 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.42188 0.174805C6.22176 -0.0585189 12.4443 -0.0585189 15.2441 0.174805L15.5205 0.201172C18.301 0.52278 18.666 2.34819 18.666 7.01953L18.6611 7.88867C18.6073 12.0675 18.0875 13.7173 15.2441 13.8633C12.4443 14.0188 6.22176 14.0188 3.42188 13.8633C0.578361 13.6445 0.0586929 12.0584 0.00488281 7.8877L0 7.01953C0 2.19762 0.38885 0.408191 3.42188 0.174805ZM14.3408 4.35645C11.7471 4.19535 6.91592 4.19528 4.32324 4.35645C4.32301 4.35898 4.32349 4.36171 4.32324 4.36426C4.26079 4.997 4.23633 5.84189 4.23633 7.01953C4.23634 8.18908 4.26073 9.02989 4.32227 9.66113C6.97053 9.76641 11.6955 9.76642 14.3438 9.66113C14.4047 9.02358 14.4297 8.18021 14.4297 7.01953C14.4297 5.84189 14.4042 4.997 14.3418 4.36426C14.3415 4.36168 14.3411 4.35901 14.3408 4.35645ZM7 7.01855C7.00033 5.58953 8.50397 4.66068 9.78223 5.2998C11.1991 6.00841 11.1992 8.02969 9.78223 8.73828C8.50383 9.37748 7 8.44785 7 7.01855Z" fill="#D28A4C" />
                  </svg>

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
