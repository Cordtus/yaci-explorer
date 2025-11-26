import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

test.describe('Frontend Audit', () => {
  test('Home page - Dashboard metrics and latest data', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Check for key sections
    const latestBlocks = page.locator('text=Latest Blocks')
    const latestTxs = page.locator('text=Latest Transactions')

    await expect(latestBlocks).toBeVisible()
    await expect(latestTxs).toBeVisible()

    await page.screenshot({ path: 'test-results/01-home.png', fullPage: true })

    if (errors.length > 0) {
      console.log('Home page console errors:', errors)
    }
  })

  test('Blocks page - List and pagination', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto(`${BASE_URL}/blocks`)
    await page.waitForLoadState('networkidle')

    // Check table headers
    await expect(page.locator('text=Height').first()).toBeVisible()

    // Check pagination exists
    const pagination = page.locator('[class*="pagination"]').or(page.locator('button:has-text("Next")'))

    await page.screenshot({ path: 'test-results/02-blocks.png', fullPage: true })

    if (errors.length > 0) {
      console.log('Blocks page console errors:', errors)
    }
  })

  test('Transactions page - List and filters', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto(`${BASE_URL}/tx`)
    await page.waitForLoadState('networkidle')

    // Check table exists
    await expect(page.locator('table').first()).toBeVisible()

    await page.screenshot({ path: 'test-results/03-transactions.png', fullPage: true })

    if (errors.length > 0) {
      console.log('Transactions page console errors:', errors)
    }
  })

  test('Transaction detail - Messages & Events', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    // Use known transaction hash
    await page.goto(`${BASE_URL}/tx/488a71f3eb96db3e7ec35cd8b1e6e4a6f29af551a26c512c53df48bc4d14308a`)
    await page.waitForLoadState('networkidle')

    // Check for Messages & Events section
    const messagesSection = page.locator('text=Messages & Events')
    await expect(messagesSection).toBeVisible()

    // Check for EVM Transaction card (sidebar)
    const evmCard = page.locator('text=EVM Transaction').or(page.locator('text=EVM Hash'))

    await page.screenshot({ path: 'test-results/04-tx-detail.png', fullPage: true })

    // Expand first message if collapsed
    const expandButton = page.locator('[data-state="closed"]').first()
    if (await expandButton.isVisible()) {
      await expandButton.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'test-results/04-tx-detail-expanded.png', fullPage: true })
    }

    if (errors.length > 0) {
      console.log('Transaction detail console errors:', errors)
    }
  })

  test('Analytics page - Charts render', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto(`${BASE_URL}/analytics`)
    await page.waitForLoadState('networkidle')

    // Wait for charts to render
    await page.waitForTimeout(2000)

    // Check for canvas elements (charts)
    const charts = page.locator('canvas')
    const chartCount = await charts.count()

    await page.screenshot({ path: 'test-results/05-analytics.png', fullPage: true })

    console.log(`Analytics page: Found ${chartCount} charts`)

    if (errors.length > 0) {
      console.log('Analytics page console errors:', errors)
    }
  })

  test('Block detail page', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto(`${BASE_URL}/blocks/30587`)
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: 'test-results/06-block-detail.png', fullPage: true })

    if (errors.length > 0) {
      console.log('Block detail console errors:', errors)
    }
  })

  test('Search functionality', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]').or(page.locator('[cmdk-input]'))

    if (await searchInput.isVisible()) {
      // Test block search
      await searchInput.fill('30587')
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'test-results/07-search-block.png' })

      // Clear and test tx hash
      await searchInput.clear()
      await searchInput.fill('488a71f3eb96db3e7ec35cd8b1e6e4a6f29af551a26c512c53df48bc4d14308a')
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'test-results/07-search-tx.png' })
    }
  })
})
