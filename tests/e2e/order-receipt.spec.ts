import { test, expect } from '@playwright/test';

test.describe('Confirmação de Pedido (Recibo) - Snapshot Imutável & A11y', () => {
  test.beforeEach(async ({ page }) => {
    // Reset database to ensure clean state
    await page.request.post('/api/__test__/reset');

    // Setup authenticated session
    await page.addInitScript(() => {
      const mockUser = {
        id: 'user_1',
        name: 'Satoshi Nakamoto',
        email: 'satoshi@kurio.app',
        primaryWalletAddress: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b'
      };
      window.localStorage.setItem('@kurio:auth_token', 'mock-token-user_1');
      window.localStorage.setItem('@kurio:auth_user', JSON.stringify(mockUser));
    });
  });

  test('Fidelidade visual, envelope, colunas e ausência de overflow', async ({ page }) => {
    // Grant clipboard permissions for testing copy button
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/orders/ord_figma_receipt');
    await page.waitForLoadState('networkidle');

    // 1. Check no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // 2. Receipt Modal Card exists
    const receiptCard = page.locator('article[aria-labelledby="receipt-heading"]');
    await expect(receiptCard).toBeVisible();

    // 3. Header: Envelope illustration and confirmation text
    await expect(receiptCard.locator('svg[viewBox="0 0 80 80"]')).toBeVisible();
    await expect(receiptCard.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible();

    // 4. Close X button
    const closeBtn = receiptCard.getByLabel('Fechar recibo e voltar ao início');
    await expect(closeBtn).toBeVisible();

    // 5. 4-column meta strip
    await expect(receiptCard.getByText('ID da transação')).toBeVisible();
    await expect(receiptCard.getByText('0xA91F...E82C')).toBeVisible();
    await expect(receiptCard.getByText('Data')).toBeVisible();
    await expect(receiptCard.getByText('29 Jul, 2026')).toBeVisible();
    await expect(receiptCard.getByText('Total').first()).toBeVisible();
    await expect(receiptCard.getByText('26.846 ETH').first()).toBeVisible();
    await expect(receiptCard.getByText('Carteira', { exact: true })).toBeVisible();
    await expect(receiptCard.getByText('MetaMask', { exact: true })).toBeVisible();

    // 6. Copy transaction ID with accessible polite region
    const copyBtn = receiptCard.getByLabel('Copiar identificador da transação');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // Live region announcement
    const liveRegion = receiptCard.locator('[aria-live="polite"]');
    await expect(liveRegion).toHaveText('Identificador da transação copiado com sucesso');

    // 7. Transaction details heading and table header
    await expect(receiptCard.getByRole('heading', { name: 'Detalhes da transação' })).toBeVisible();
    await expect(receiptCard.getByText('NFTs', { exact: true })).toBeVisible();
    await expect(receiptCard.getByText('Edições', { exact: true })).toBeVisible();
    await expect(receiptCard.getByText('Subtotal', { exact: true })).toBeVisible();

    // 8. Items List
    // Item 1: Emerald Ape #042
    await expect(receiptCard.getByText('Emerald Ape #042')).toBeVisible();
    await expect(receiptCard.getByText('ID do token: #0042')).toBeVisible();
    await expect(receiptCard.getByText('(x 2)')).toBeVisible();
    await expect(receiptCard.getByText('2.38 ETH')).toBeVisible();

    // Item 2: Violet Nomad #314
    await expect(receiptCard.getByText('Violet Nomad #314')).toBeVisible();
    await expect(receiptCard.getByText('ID do token: #0314')).toBeVisible();
    await expect(receiptCard.getByText('(x 6)')).toBeVisible();
    await expect(receiptCard.getByText('8.34 ETH')).toBeVisible();

    // Item 3: Ivory Baron #088
    await expect(receiptCard.getByText('Ivory Baron #088')).toBeVisible();
    await expect(receiptCard.getByText('ID do token: #0088')).toBeVisible();
    await expect(receiptCard.getByText('(x 9)')).toBeVisible();
    await expect(receiptCard.getByText('16.11 ETH')).toBeVisible();

    // 9. Financial breakdown
    await expect(receiptCard.getByText('Taxa de rede')).toBeVisible();
    await expect(receiptCard.getByText('0.016 ETH')).toBeVisible();
    await expect(receiptCard.getByText('26.846 ETH').last()).toBeVisible();

    // 10. Confirmation explanatory note
    await expect(
      receiptCard.getByText('Transação confirmada na Ethereum. A propriedade foi transferida para sua carteira conectada e registrada na rede.')
    ).toBeVisible();

    // 11. "Ver no Etherscan" CTA button with safe external link
    const etherscanLink = receiptCard.getByLabel('Ver transação no explorador de blocos Etherscan (abre em nova aba)');
    await expect(etherscanLink).toBeVisible();
    await expect(etherscanLink).toHaveAttribute('target', '_blank');
    await expect(etherscanLink).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(etherscanLink).toHaveAttribute('href', /etherscan\.io\/tx\//);

    // 12. Secondary actions
    await expect(receiptCard.getByText('← Explorar mais NFTs')).toBeVisible();
    await expect(receiptCard.getByLabel('Imprimir recibo da transação')).toBeVisible();
  });

  test('Snapshot Imutável: Alterações no catálogo não refletem nem modificam o recibo emitido', async ({ page }) => {
    await page.goto('/orders/ord_figma_receipt');
    await page.waitForLoadState('networkidle');

    // Initial state: Emerald Ape executed price is 1.19 ETH (2 units = 2.38 ETH)
    const receiptCard = page.locator('article[aria-labelledby="receipt-heading"]');
    await expect(receiptCard.getByText('Emerald Ape #042')).toBeVisible();
    await expect(receiptCard.getByText('2.38 ETH')).toBeVisible();

    // Mutate live catalog price of nft-01 via socket or API simulation
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('kurio:nft-updated', {
          detail: {
            id: 'nft-01',
            name: 'Emerald Ape #042 (Alterado no Catálogo)',
            priceEth: '5.50',
            availableEditions: 0
          }
        })
      );
    });

    // Receipt MUST remain immutable: still 2.38 ETH, original name
    await expect(receiptCard.getByText('2.38 ETH')).toBeVisible();
    await expect(receiptCard.getByText('26.846 ETH').first()).toBeVisible();
  });

  test('Status PENDING: Exibe estado de processamento/mineração na blockchain', async ({ page }) => {
    await page.goto('/orders/ord_pending_demo');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Processando Transação na Blockchain')).toBeVisible();
    await expect(page.getByText('Sua solicitação de compra foi enviada para o contrato inteligente.')).toBeVisible();
  });

  test('Status DECLINED: Exibe feedback de recusa com motivo e botão de novo checkout', async ({ page }) => {
    await page.goto('/orders/ord_declined_demo');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Pagamento Recusado')).toBeVisible();
    await expect(page.getByText('Saldo insuficiente de gás para execução da transação.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tentar Checkout Novamente' })).toBeVisible();
  });
});
