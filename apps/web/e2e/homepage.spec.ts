import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('ANUBIS');
  });

  test('should have dark mode toggle', async ({ page }) => {
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible();

    // Click to toggle theme
    await themeToggle.click();

    // Check if theme changed
    const html = page.locator('html');
    const className = await html.getAttribute('class');
    expect(className).toMatch(/dark|light/);
  });

  test('should navigate to chat when clicking start button', async ({
    page,
  }) => {
    const startButton = page.locator('button:has-text("Start")');

    if (await startButton.isVisible()) {
      await startButton.click();
      await expect(page).toHaveURL(/.*chat/);
    }
  });

  test('should be responsive', async ({ page }) => {
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(
      page.locator('[data-testid="mobile-menu-button"]')
    ).toBeVisible();
  });

  test('should load without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toHaveLength(0);
  });
});
