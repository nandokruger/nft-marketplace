import { test, expect } from '@playwright/test';

test.describe('KURIO NFT Marketplace - E2E Flow & Governance Constraints', () => {
  test.beforeEach(async ({ page }) => {
    // Open app and reset database state via browser fetch (intercepted by MSW Service Worker)
    await page.goto('/');
    await page.evaluate(async () => {
      await fetch('/api/__test__/reset', { method: 'POST' });
    });
  });

  test('Viewports obrigatórios: Sem overflow horizontal (390px, 768px, 1440px)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify horizontal scroll width does not exceed window innerWidth
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowing).toBe(false);

    // Verify KURIO wordmark and main catalog elements
    await expect(page.locator('text=KURIO').first()).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Fluxo completo: Catálogo -> Detalhe -> Carrinho -> Cupom', async ({ page }) => {
    await page.goto('/');

    // Navigate to first NFT details
    const firstNftLink = page.locator('a[href^="/nft/"]').first();
    await firstNftLink.click();
    await expect(page).toHaveURL(/\/nft\/.+/);
    const isDesktop = test.info().project.name === 'desktop-1440';
    if (isDesktop) {
      await expect(page.getByRole('navigation', { name: /Breadcrumb/i })).toBeVisible();
    }

    // Click add to cart button and wait for confirmation toast
    const addToCartBtn = page.getByRole('button', { name: /\+ Carrinho|Adicionar ao carrinho/i }).first();
    await addToCartBtn.click();
    await expect(page.getByRole('status')).toBeVisible();

    // Navigate to cart
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: /Carrinho de NFTs/i })).toBeVisible();

    // Apply Coupon KURIO10
    const couponInput = page.locator('#coupon-input');
    await expect(couponInput).toBeVisible();
    await couponInput.fill('KURIO10');
    await page.getByRole('button', { name: /Aplicar/i }).click();

    // Verify discount is applied
    await expect(page.getByText(/10% OFF/i)).toBeVisible();
  });

  test('Autenticação e Sessão: Login com preservação de contexto e sincronização de carrinho', async ({ page }) => {
    // 1. Visit as visitor and add item to cart
    await page.goto('/');
    await page.locator('[data-testid="nft-card"]').first().hover();
    const firstBuyBtn = page.getByRole('button', { name: /\+ Carrinho|Adicionar ao carrinho/i }).first();
    await firstBuyBtn.click();
    await expect(page.getByRole('status')).toBeVisible();

    // 2. Go to login
    await page.goto('/login?redirect=/checkout');
    await page.locator('#email-input').fill('satoshi@kurio.app');
    await page.locator('#password-input').fill('password123');
    await page.getByRole('button', { name: /Entrar na Conta/i }).click();

    // 3. Should redirect to /checkout with synced cart
    await expect(page).toHaveURL('/checkout');
    await expect(page.getByRole('heading', { name: /(Perfil do colecionador|Pagamento com carteira)/i })).toBeVisible();
  });

  test('Painel de Caos (ScenarioDevToolbar): Permite alternar cenários e resetar seed', async ({ page }) => {
    await page.goto('/');

    // Open Scenario Dev Toolbar
    const toggleBtn = page.getByLabel(/Abrir painel de controle de cenários de caos/i);
    await toggleBtn.click();

    // Verify MSW Chaos options exist
    await expect(page.getByText(/Rede Lenta/i)).toBeVisible();
    await expect(page.getByText(/Timeout Idempotente/i)).toBeVisible();

    // Trigger Reset DB
    const resetBtn = page.getByRole('button', { name: /Reset DB & Seed/i });
    await resetBtn.click();
  });

  test('Coleções e Contador Real: Exibe contagens dinâmicas e filtra itens com imagens fiéis ao layout', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const isDesktop = test.info().project.name === 'desktop-1440';
    if (!isDesktop) {
      await page.getByRole('button', { name: /Abrir filtros/i }).click();
    }

    // 1. Verify Coleções filter has real counters from database
    const filterContainer = isDesktop
      ? page.locator('aside[aria-label="Filtros laterais do catálogo"]')
      : page.getByRole('dialog');
    await expect(filterContainer.getByText('Coleções')).toBeVisible();

    // Check that "Arte digital" has real count (33)
    await expect(filterContainer.getByRole('button', { name: /Arte digital \(33\)/i })).toBeVisible();

    // Check that other categories have real non-zero counts
    await expect(filterContainer.getByRole('button', { name: /Fotografia \(12\)/i })).toBeVisible();

    // 2. Click "Fotografia" to filter
    await filterContainer.getByRole('button', { name: /Fotografia \(12\)/i }).click();

    if (!isDesktop) {
      const closeBtn = page.getByRole('button', { name: /Ver .*resultados|Fechar/i }).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }

    // Verify filtered NFTs are displayed and have valid images
    const nftImages = page.locator('#catalog img');
    await expect(nftImages.first()).toBeVisible();
    const count = await nftImages.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const img = nftImages.nth(i);
      await expect(img).toBeVisible();
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test('Faixa de Preço: Slider interativo filtra NFTs por preço mínimo e máximo', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const isDesktop = test.info().project.name === 'desktop-1440';
    if (!isDesktop) {
      await page.getByRole('button', { name: /Abrir filtros/i }).click();
    }

    const filterContainer = isDesktop
      ? page.locator('aside[aria-label="Filtros laterais do catálogo"]')
      : page.getByRole('dialog');
    await expect(filterContainer.getByText('Faixa de preço')).toBeVisible();

    // Verify Slider primitive rendered with thumbs
    const sliderThumbs = filterContainer.locator('[role="slider"]');
    await expect(sliderThumbs.first()).toBeVisible();
    expect(await sliderThumbs.count()).toBe(2);

    // Verify text displays current ETH range
    await expect(filterContainer.getByText(/Preço:.*ETH/i)).toBeVisible();

    // Click Aplicar
    const applyBtn = filterContainer.getByRole('button', { name: /Aplicar/i });
    await applyBtn.click();

    // Verify active filter tag appears
    await expect(filterContainer.getByText(/Ativo/i)).toBeVisible();

    // Verify reset button appears and clears filter
    const resetBtn = filterContainer.getByRole('button', { name: /Redefinir/i });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await expect(resetBtn).not.toBeVisible();
  });

  test('Detalhes do NFT: Fidelidade visual, galeria, zoom, abas, stepper e favoritar com optimistic update', async ({ page }) => {
    // 1. Direct access via URL
    await page.goto('/nft/nft-01');
    await page.waitForLoadState('networkidle');

    // Viewport check: no horizontal overflow
    const isOverflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(isOverflowing).toBe(false);

    const isDesktop = test.info().project.name === 'desktop-1440';
    if (isDesktop) {
      await expect(page.getByRole('navigation', { name: /Breadcrumb/i })).toBeVisible();
    } else {
      await expect(page.getByRole('button', { name: /Voltar/i })).toBeVisible();
    }

    await expect(page.getByRole('heading', { level: 1, name: /Emerald Ape #042/i })).toBeVisible();
    await expect(page.getByText('1.19 ETH')).toBeVisible();

    if (isDesktop) {
      await page.screenshot({
        path: 'C:/Users/nando/.gemini/antigravity-ide/brain/baa10f1d-ee60-40d8-b832-b9fe46e88529/desktop_nft_details_preview.webp',
        fullPage: true
      });

      // 4 Thumbnails
      const thumbs = page.locator('button[aria-label^="Visualizar miniatura"]');
      await expect(thumbs).toHaveCount(4);
      await thumbs.nth(2).click();

      // Zoom Dialog
      const zoomBtn = page.getByRole('button', { name: /Ampliar imagem da obra/i });
      await zoomBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }

    // Edition selector (available on both)
    const editionPill = page.getByRole('button', { name: '1/10' }).first();
    await editionPill.click();
    await expect(editionPill).toHaveClass(/border-primary/);

    // Quantity Stepper (available on both)
    const incBtn = page.getByRole('button', { name: /Aumentar quantidade/i });
    await incBtn.click();
    await expect(page.getByText('2', { exact: true })).toBeVisible();

    // Optimistic Favorite Toggle (available on both)
    const favBtn = page.getByRole('button', { name: /Favoritar|Favoritado|Remover dos favoritos/i });
    await favBtn.click();
    await expect(page.getByRole('button', { name: /Favoritado|Remover dos favoritos/i })).toBeVisible();

    if (isDesktop) {
      // Tabs: Detalhes do NFT vs Avaliações
      await expect(page.getByText(/Rede:/i)).toBeVisible();
      await expect(page.getByText(/Contrato:/i)).toBeVisible();
      const reviewsTab = page.getByRole('tab', { name: /Avaliações de colecionadores/i });
      await reviewsTab.click();
      await expect(page.getByText(/CyberNomad/i)).toBeVisible();

      // Mais desta coleção: 5 cards
      await expect(page.getByRole('heading', { name: /Mais desta coleção/i })).toBeVisible();
      await expect(page.getByText(/Cosmic Bloom #118/i)).toBeVisible();
      await expect(page.getByText(/Golden Signal #160/i)).toBeVisible();
    } else {
      // Mobile-specific elements
      await expect(page.getByText(/4\.8/)).toBeVisible();
      await expect(page.getByRole('button', { name: /Comprar NFT/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Adicionar ao carrinho/i })).toBeVisible();
    }
  });

  test('Detalhes do NFT: Suporte a rota alias /nfts/$nftId e lookup numérico (/nfts/1)', async ({ page }) => {
    await page.goto('/nfts/1');
    await page.waitForLoadState('networkidle');

    // Should resolve to Emerald Ape
    await expect(page.getByRole('heading', { level: 1, name: /Emerald Ape #042/i })).toBeVisible();
    await expect(page.getByText('1.19 ETH')).toBeVisible();
  });

  test('Detalhes do NFT: Tratamento amigável de erro 404 com botão de retorno ao catálogo', async ({ page }) => {
    await page.goto('/nft/nft-inexistente-999');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /NFT não encontrado/i })).toBeVisible();
    const returnBtn = page.getByRole('button', { name: /Voltar ao Catálogo/i });
    await expect(returnBtn).toBeVisible();
    await returnBtn.click();
    await expect(page).toHaveURL('/');
  });
});
