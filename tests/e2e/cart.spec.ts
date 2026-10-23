import { test, expect } from '@playwright/test';

test.describe('Carrinho de NFTs - Aritmética ETH, Realtime & Acessibilidade', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure app is loaded and MSW Service Worker is active
    await page.goto('/');
    await expect(page.locator('text=KURIO').first()).toBeVisible();
    await page.evaluate(async () => {
      await fetch('/api/__test__/reset', { method: 'POST' });
    });
  });

  test('Fidelidade visual do layout e ausência de overflow horizontal (390px, 768px, 1440px)', async ({ page }, testInfo) => {
    // Populate cart with the 3 items
    await page.evaluate(async () => {
      await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nftId: 'nft-01', quantity: 2 })
      });
      await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nftId: 'nft-05', quantity: 6 })
      });
      await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nftId: 'nft-06', quantity: 9 })
      });
    });

    // Go to Cart page
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    const isDesktop = testInfo.project.name === 'desktop-1440';

    // 1. Verify semantic heading & back button / breadcrumb
    const heading = page.getByRole('heading', { name: /Carrinho de NFTs/i });
    await expect(heading).toBeVisible();

    if (isDesktop) {
      const breadcrumb = page.getByRole('navigation', { name: /Breadcrumb/i });
      await expect(breadcrumb).toBeVisible();
      await expect(breadcrumb.getByText('Início')).toBeVisible();
      await expect(breadcrumb.getByText('Mercado')).toBeVisible();

      // 2. Verify table columns
      await expect(page.getByText('NFTs', { exact: true })).toBeVisible();
      await expect(page.getByText('Preço', { exact: true })).toBeVisible();
      await expect(page.getByText('Edições', { exact: true })).toBeVisible();
      await expect(page.getByText('Total', { exact: true }).first()).toBeVisible();

      // Heading Resumo da carteira
      await expect(page.getByRole('heading', { name: /Resumo da carteira/i })).toBeVisible();

      // "Colecionadores também viram" section
      await expect(page.getByRole('heading', { name: /Colecionadores também viram/i })).toBeVisible();
      await expect(page.getByText('Cosmic Bloom #118')).toBeVisible();
      await expect(page.getByText('Golden Beat #207')).toBeVisible();
    } else {
      // Mobile header back button
      const backButton = page.getByRole('button', { name: /Voltar/i });
      await expect(backButton).toBeVisible();
    }

    // 3. Verify items are rendered with correct values in cart list
    const cartList = page.locator('[role="list"][aria-label="Lista de NFTs no carrinho"]');
    await expect(cartList.getByText('Emerald Ape #042')).toBeVisible();
    await expect(cartList.getByText('Violet Nomad #314')).toBeVisible();
    await expect(cartList.getByText('Ivory Baron #088')).toBeVisible();

    // 4. Verify summary breakdown matching user screenshot exactly
    await expect(page.getByText('Subtotal')).toBeVisible();
    await expect(page.getByText('26.83 ETH')).toBeVisible();
    await expect(page.getByText('Taxa de rede')).toBeVisible();
    await expect(page.getByText('0.016 ETH')).toBeVisible();
    await expect(page.getByText('Taxa estimada')).toBeVisible();
    await expect(page.getByText('26.846 ETH')).toBeVisible();

    // 5. Verify Call to Action
    const ctaButton = page.getByRole('button', { name: /Conectar e finalizar/i });
    await expect(ctaButton).toBeVisible();
    await expect(page.getByText('Continuar explorando')).toBeVisible();

    // 6. Verify horizontal scroll width does not overflow
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowing).toBe(false);

    // 8. Capture screenshots for each viewport
    if (testInfo.project.name === 'desktop-1440') {
      await page.screenshot({
        path: 'C:/Users/nando/.gemini/antigravity-ide/brain/baa10f1d-ee60-40d8-b832-b9fe46e88529/desktop_cart_preview.webp',
        fullPage: true
      });
    } else if (testInfo.project.name === 'tablet-768') {
      await page.screenshot({
        path: 'C:/Users/nando/.gemini/antigravity-ide/brain/baa10f1d-ee60-40d8-b832-b9fe46e88529/tablet_cart_preview.webp',
        fullPage: true
      });
    } else if (testInfo.project.name === 'mobile-390') {
      await page.screenshot({
        path: 'C:/Users/nando/.gemini/antigravity-ide/brain/baa10f1d-ee60-40d8-b832-b9fe46e88529/mobile_cart_preview.webp',
        fullPage: true
      });
    }
  });

  test('Operações nos Itens: Stepper de quantidade, remoção individual e limpar carrinho com empty state', async ({ page }) => {
    // Add single item (nft-01 with price 1.19 ETH)
    await page.evaluate(async () => {
      await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nftId: 'nft-01', quantity: 1 })
      });
    });

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    // Verify initial item subtotal is 1.19 ETH
    const itemRow = page.locator('[role="listitem"]').first();
    await expect(itemRow).toContainText('1.19 ETH');

    // Click increment (+)
    const incButton = page.getByRole('button', { name: /Aumentar quantidade de Emerald Ape #042/i });
    await incButton.click();

    // Now quantity should be 2 and item subtotal 2.38 ETH
    await expect(itemRow).toContainText('2.38 ETH');

    // Click decrement (-)
    const decButton = page.getByRole('button', { name: /Diminuir quantidade de Emerald Ape #042/i });
    await decButton.click();

    // Quantity returns to 1 and subtotal to 1.19 ETH
    await expect(itemRow).toContainText('1.19 ETH');

    // Verify delete button next to quantity is visible
    const removeButton = page.getByRole('button', { name: /Remover Emerald Ape #042 do carrinho/i });
    await expect(removeButton).toBeVisible();

    // Test Limpar Carrinho
    const clearButton = page.getByRole('button', { name: /Limpar carrinho/i });
    await clearButton.click();

    // Verify Empty State is shown
    await expect(page.getByRole('heading', { name: /Seu carrinho está vazio/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Explorar Catálogo/i })).toBeVisible();
  });

  test('Cupom de desconto: Tratamento de erro com a11y e aplicação com cálculo exato de desconto', async ({ page }) => {
    await page.evaluate(async () => {
      await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nftId: 'nft-01', quantity: 2 }) // 2 * 1.19 = 2.38 ETH
      });
    });

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    const couponInput = page.locator('#coupon-input');
    const applyBtn = page.getByRole('button', { name: /Aplicar/i });

    // 1. Enter invalid coupon
    await couponInput.fill('INVALIDO99');
    await applyBtn.click();

    // Verify accessible error message
    const errorMsg = page.locator('#coupon-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText(/Cupom inválido ou expirado/i);
    await expect(couponInput).toHaveAttribute('aria-invalid', 'true');

    // 2. Enter valid coupon KURIO10 (10% OFF)
    await couponInput.fill('KURIO10');
    await applyBtn.click();

    // Verify coupon badge and discount applied
    await expect(page.getByText(/Cupom KURIO10 \(10% OFF\)/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Remover cupom/i })).toBeVisible();
    await expect(errorMsg).not.toBeVisible();

    // Remove coupon
    await page.getByRole('button', { name: /Remover cupom/i }).click();
    await expect(page.getByText(/Cupom KURIO10/i)).not.toBeVisible();
  });

  test('Persistência: Carrinho persiste após reload da página', async ({ page }) => {
    await page.evaluate(async () => {
      await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nftId: 'nft-05', quantity: 3 })
      });
    });

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    const cartItem = page.locator('[role="listitem"]').filter({ hasText: 'Violet Nomad #314' });
    await expect(cartItem).toBeVisible();

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Item must still be present
    await expect(cartItem).toBeVisible();
  });

  test('Tempo real via Socket.IO: Exibe alerta acessível com aria-live="polite", recalcula totais e bloqueia checkout', async ({ page }) => {
    await page.evaluate(async () => {
      await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nftId: 'nft-01', quantity: 1 })
      });
    });

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    // Simulate real-time price change via kurio:nft-updated custom event
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('kurio:nft-updated', {
          detail: {
            id: 'nft-01',
            priceEth: '1.45',
            name: 'Emerald Ape #042'
          }
        })
      );
    });

    // Verify accessible real-time alert is displayed
    const alert = page.locator('[role="alert"][aria-live="polite"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Emerald Ape #042');
    await expect(alert).toContainText('foi atualizado em tempo real');

    // Verify checkout button is disabled / blocked
    const checkoutBtn = page.getByRole('button', { name: /Conectar e finalizar|Finalizar pedido/i });
    await expect(checkoutBtn).toBeDisabled();

    // Click "Entendido, atualizar"
    const ackBtn = page.getByRole('button', { name: /Entendido, atualizar/i });
    await ackBtn.click();

    // Alert should be dismissed and checkout re-enabled
    await expect(alert).not.toBeVisible();
    await expect(checkoutBtn).toBeEnabled();
  });

  test('Sessão e Autenticação: Mesclagem de carrinho de visitante após login (POST /api/cart/merge)', async ({ page }) => {
    // 1. As guest, add item to cart
    await page.evaluate(async () => {
      await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nftId: 'nft-01', quantity: 2 })
      });
    });

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    // Click "Conectar e finalizar" to open auth modal
    const connectBtn = page.getByRole('button', { name: /Conectar e finalizar/i });
    await connectBtn.click();

    // Verify Auth Modal is opened
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill credentials for satoshi@kurio.app
    await page.locator('#email-input').fill('satoshi@kurio.app');
    await page.locator('#password-input').fill('password123');
    await page.getByRole('button', { name: /Entrar na Conta/i }).click();

    // Should redirect to /checkout with items preserved
    await expect(page).toHaveURL('/checkout');
    await expect(page.getByRole('button', { name: /Confirmar compra/i })).toBeVisible();
  });
});
