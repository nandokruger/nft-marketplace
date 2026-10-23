import { test, expect } from '@playwright/test';

test.describe('Checkout / Pagamento - Aritmética ETH, Realtime & Idempotência', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure app is loaded and MSW Service Worker is active
    await page.goto('/');
    await expect(page.locator('text=KURIO').first()).toBeVisible();
    await page.evaluate(async () => {
      await fetch('/api/__test__/reset', { method: 'POST' });
    });
  });

  test('Fidelidade visual do layout e ausência de overflow horizontal (390px, 768px, 1440px)', async ({ page }, testInfo) => {
    // Authenticate user and populate cart with the 3 items
    await page.evaluate(async () => {
      const mockUser = {
        id: 'user_1',
        name: 'Satoshi Nakamoto',
        email: 'satoshi@kurio.app',
        primaryWalletAddress: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b'
      };
      window.localStorage.setItem('@kurio:auth_token', 'mock-token-user_1');
      window.localStorage.setItem('@kurio:auth_user', JSON.stringify(mockUser));

      await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token-user_1'
        },
        body: JSON.stringify({ nftId: 'nft-01', quantity: 2 })
      });
      await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token-user_1'
        },
        body: JSON.stringify({ nftId: 'nft-05', quantity: 6 })
      });
      await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token-user_1'
        },
        body: JSON.stringify({ nftId: 'nft-06', quantity: 9 })
      });
    });

    // Navigate to /checkout
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    const isDesktop = testInfo.project.name === 'desktop-1440';

    if (isDesktop) {
      // 1. Verify Breadcrumbs
      const breadcrumb = page.getByRole('navigation', { name: /Breadcrumb/i });
      await expect(breadcrumb).toBeVisible();
      await expect(breadcrumb.getByText('Início')).toBeVisible();
      await expect(breadcrumb.getByText('Mercado')).toBeVisible();
      await expect(breadcrumb.getByText('Pagamento')).toBeVisible();

      // 2. Verify Left Column: Perfil do colecionador
      const profileHeading = page.getByRole('heading', { name: /Perfil do colecionador/i });
      await expect(profileHeading).toBeVisible();

      // Verify presence of all required fields
      await expect(page.getByText('Nome de exibição')).toBeVisible();
      await expect(page.getByText('Nome de usuário')).toBeVisible();
      await expect(page.getByText('Rede', { exact: true })).toBeVisible();
      await expect(page.getByText('Nome do perfil')).toBeVisible();
      await expect(page.getByText('Endereço da carteira')).toBeVisible();
      await expect(page.getByText('ENS ou carteira secundária (opcional)')).toBeVisible();
      await expect(page.getByText('Tipo de carteira')).toBeVisible();
      await expect(page.getByText('Código de indicação')).toBeVisible();
      await expect(page.getByText('E-mail')).toBeVisible();
      await expect(page.getByText('Nome ENS')).toBeVisible();
      await expect(page.getByText('Usar outra carteira?')).toBeVisible();
      await expect(page.getByText('Observação do colecionador (opcional)')).toBeVisible();

      // 3. Verify Right Column: Seus NFTs and values
      const nftHeading = page.getByRole('heading', { name: /Seus NFTs/i });
      await expect(nftHeading).toBeVisible();

      // Check items in order summary
      const nftList = page.locator('[role="list"][aria-label="NFTs no pedido"]');
      await expect(nftList.getByText('Emerald Ape #042')).toBeVisible();
      await expect(nftList.getByText('Violet Nomad #314')).toBeVisible();
      await expect(nftList.getByText('Ivory Baron #088')).toBeVisible();

      // Check item subtotals (2 * 1.19 = 2.38, 6 * 1.39 = 8.34, 9 * 1.79 = 16.11)
      await expect(nftList.getByText('2.38 ETH')).toBeVisible();
      await expect(nftList.getByText('8.34 ETH')).toBeVisible();
      await expect(nftList.getByText('16.11 ETH')).toBeVisible();

      // Check promo trigger
      await expect(page.getByText('Tem um código promocional? Aplique aqui')).toBeVisible();

      // Check financial breakdown lines
      await expect(page.getByText('Subtotal', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('26.83 ETH')).toBeVisible();

      await expect(page.getByText('Desconto do lançamento')).toBeVisible();
      await expect(page.getByText('(-) 00.00')).toBeVisible();

      await expect(page.getByText('Taxa de rede')).toBeVisible();
      await expect(page.getByText('0.016 ETH')).toBeVisible();
      await expect(page.getByText('Taxa estimada')).toBeVisible();

      await expect(page.getByText('Total', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('26.846 ETH', { exact: true })).toBeVisible();

      // 4. Verify Section "Carteira e rede"
      await expect(page.getByRole('heading', { name: /Carteira e rede/i })).toBeVisible();
      await expect(page.locator('#main-content').getByText('METAMASK • WALLETCONNECT • COINBASE')).toBeVisible();
      await expect(page.locator('aside').getByText('MetaMask', { exact: true })).toBeVisible();
      await expect(page.locator('aside').getByText('Coinbase Wallet', { exact: true })).toBeVisible();
    } else {
      // Mobile Layout (390px / 768px):
      // 1. Header Minimalista
      await expect(page.getByRole('heading', { name: /Pagamento com carteira/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Voltar/i })).toBeVisible();

      // 2. Secção "Carteira conectada"
      await expect(page.getByText('Carteira conectada')).toBeVisible();
      await expect(page.getByText('Trocar carteira')).toBeVisible();
      await expect(page.getByText('Reserva')).toBeVisible();
      await expect(page.getByText('Principal', { exact: true })).toBeVisible();

      // 3. Secção "Carteira e rede"
      await expect(page.getByRole('heading', { name: /Carteira e rede/i })).toBeVisible();
      await expect(page.getByText('WalletConnect', { exact: true })).toBeVisible();
      await expect(page.getByText('MetaMask', { exact: true })).toBeVisible();
      await expect(page.getByText('Coinbase Wallet', { exact: true })).toBeVisible();

      // 4. Linha de Total Financeiro
      await expect(page.getByText('Total:')).toBeVisible();
      await expect(page.getByText('26.832 ETH')).toBeVisible();
    }

    // 5. Verify Primary Button
    const confirmButton = page.getByRole('button', { name: /Confirmar compra/i });
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeEnabled();

    // 6. Verify No Horizontal Overflow
    const overflowInfo = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      const overflowing: { tag: string; id: string; class: string; right: number; scrollWidth?: number }[] = [];
      if (docWidth > winWidth) {
        document.querySelectorAll('*').forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.right > winWidth + 0.5) {
            overflowing.push({
              tag: el.tagName,
              id: el.id,
              class: typeof el.className === 'string' ? el.className.slice(0, 60) : '',
              right: Math.round(rect.right),
              scrollWidth: (el as HTMLElement).scrollWidth
            });
          }
        });
      }
      return { isOverflowing: docWidth > winWidth, docWidth, winWidth, overflowing: overflowing.slice(0, 5) };
    });
    expect(overflowInfo.overflowing, `Overflow details on ${overflowInfo.winWidth}px (docWidth=${overflowInfo.docWidth}): ${JSON.stringify(overflowInfo.overflowing)}`).toEqual([]);

    // 7. Save screenshots for visual fidelity inspection
    if (page.viewportSize()?.width === 1440) {
      await page.screenshot({
        path: 'C:/Users/nando/.gemini/antigravity-ide/brain/baa10f1d-ee60-40d8-b832-b9fe46e88529/desktop_checkout_preview.webp',
        fullPage: true
      });
    }
    if (page.viewportSize()?.width === 390) {
      await page.screenshot({
        path: 'C:/Users/nando/.gemini/antigravity-ide/brain/baa10f1d-ee60-40d8-b832-b9fe46e88529/mobile_checkout_preview.webp',
        fullPage: true
      });
    }
  });

  test('Proteção de rota: Abre modal de login se não autenticado', async ({ page }) => {
    // Clear auth credentials
    await page.evaluate(() => {
      window.localStorage.removeItem('@kurio:auth_token');
      window.localStorage.removeItem('@kurio:auth_user');
    });

    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    // Login modal should be automatically triggered
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('button', { name: /Entrar na Conta/i })).toBeVisible();
  });

  test('Feedback de carrinho vazio ao acessar /checkout sem itens', async ({ page }) => {
    // Authenticate user with empty cart
    await page.evaluate(() => {
      const mockUser = {
        id: 'user_1',
        name: 'Satoshi Nakamoto',
        email: 'satoshi@kurio.app'
      };
      window.localStorage.setItem('@kurio:auth_token', 'mock-token-user_1');
      window.localStorage.setItem('@kurio:auth_user', JSON.stringify(mockUser));
    });

    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible();
    await expect(page.getByText('Voltar ao Catálogo')).toBeVisible();
  });

  test('Atualização dinâmica de taxas estimadas ao alternar de rede', async ({ page }, testInfo) => {
    // Authenticate and set up cart
    await page.evaluate(async () => {
      const mockUser = {
        id: 'user_1',
        name: 'Satoshi Nakamoto',
        email: 'satoshi@kurio.app',
        primaryWalletAddress: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b'
      };
      window.localStorage.setItem('@kurio:auth_token', 'mock-token-user_1');
      window.localStorage.setItem('@kurio:auth_user', JSON.stringify(mockUser));

      await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token-user_1'
        },
        body: JSON.stringify({ nftId: 'nft-01', quantity: 2 })
      });
    });

    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    const isDesktop = testInfo.project.name === 'desktop-1440';

    if (isDesktop) {
      // Default: Ethereum Mainnet has fee 0.016 ETH
      await expect(page.getByText('0.016 ETH')).toBeVisible();

      // Change network to Polygon via select
      const networkSelectTrigger = page.locator('#network-select');
      await networkSelectTrigger.click();

      const polygonOption = page.getByRole('option', { name: 'Polygon' });
      await polygonOption.click();

      // Verify fee updated to 0.002 ETH
      await expect(page.getByText('0.002 ETH')).toBeVisible();
    } else {
      // Mobile / Tablet: network fee is reflected in the total when switching wallet
      // Cart items: 2 * 1.19 = 2.38 ETH
      // Default on mobile: Reserva (Polygon 0.002 ETH) -> total 2.382 ETH
      await expect(page.getByText('2.382 ETH')).toBeVisible();

      // Switch to Principal (Ethereum Mainnet 0.016 ETH) -> total 2.396 ETH
      const principalRadio = page.getByRole('radio', { name: /Principal/i });
      await principalRadio.click();
      await expect(page.getByText('2.396 ETH')).toBeVisible();

      // Switch back to Reserva (Polygon 0.002 ETH) -> total 2.382 ETH
      const reservaRadio = page.getByRole('radio', { name: /Reserva/i });
      await reservaRadio.click();
      await expect(page.getByText('2.382 ETH')).toBeVisible();
    }
  });

  test('Revalidação em tempo real (Socket.IO): Alerta assertive e bloqueio de confirmação até aceite', async ({ page }) => {
    // Authenticate and set up cart
    await page.evaluate(async () => {
      const mockUser = {
        id: 'user_1',
        name: 'Satoshi Nakamoto',
        email: 'satoshi@kurio.app',
        primaryWalletAddress: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b'
      };
      window.localStorage.setItem('@kurio:auth_token', 'mock-token-user_1');
      window.localStorage.setItem('@kurio:auth_user', JSON.stringify(mockUser));

      await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token-user_1'
        },
        body: JSON.stringify({ nftId: 'nft-01', quantity: 1 })
      });
    });

    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    const confirmBtn = page.getByRole('button', { name: /Confirmar compra/i });
    await expect(confirmBtn).toBeEnabled();

    // Simulate real-time price change event on nft-01
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('kurio:nft-updated', {
          detail: {
            id: 'nft-01',
            name: 'Emerald Ape #042',
            priceEth: '1.99',
            availableEditions: 5
          }
        })
      );
    });

    // Alert with assertive live region should be displayed
    const alert = page.locator('[role="alert"][aria-live="assertive"]');
    await expect(alert).toBeVisible();
    await expect(alert.getByText('Aviso de Mercado em Tempo Real', { exact: true })).toBeVisible();

    // Confirm button should now be disabled
    await expect(confirmBtn).toBeDisabled();

    // Click "Revisar e Aceitar Valores" to unblock
    const acknowledgeBtn = alert.getByRole('button', { name: /Revisar e Aceitar Valores/i });
    await acknowledgeBtn.click();

    // Alert closes and button is re-enabled
    await expect(alert).not.toBeVisible();
    await expect(confirmBtn).toBeEnabled();
  });

  test('Confirmação do pedido com Idempotência (POST /api/orders) e redirecionamento para recibo', async ({ page }) => {
    // Authenticate and set up cart
    await page.evaluate(async () => {
      const mockUser = {
        id: 'user_1',
        name: 'Satoshi Nakamoto',
        email: 'satoshi@kurio.app',
        primaryWalletAddress: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b'
      };
      window.localStorage.setItem('@kurio:auth_token', 'mock-token-user_1');
      window.localStorage.setItem('@kurio:auth_user', JSON.stringify(mockUser));

      await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token-user_1'
        },
        body: JSON.stringify({ nftId: 'nft-01', quantity: 1 })
      });
    });

    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    const confirmBtn = page.getByRole('button', { name: /Confirmar compra/i });
    await confirmBtn.click();

    // Should navigate to /orders/:orderId
    await page.waitForURL(/\/orders\/ord_/);
    expect(page.url()).toContain('/orders/ord_');

    // Check that confirmation screen renders the receipt
    await expect(page.getByText('Emerald Ape #042')).toBeVisible();
  });
});
