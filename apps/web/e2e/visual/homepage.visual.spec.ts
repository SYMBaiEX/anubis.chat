import { expect, test } from '@playwright/test';

test.describe('Homepage Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for animations to complete
    await page.waitForTimeout(500);
  });

  test('should match homepage snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      animations: 'disabled',
      mask: [page.locator('[data-testid="dynamic-content"]')],
    });
  });

  test('should match hero section snapshot', async ({ page }) => {
    const heroSection = page.locator('[data-testid="hero-section"]');
    await expect(heroSection).toHaveScreenshot('hero-section.png', {
      animations: 'disabled',
    });
  });

  test('should match dark mode snapshot', async ({ page }) => {
    // Toggle dark mode
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();
    await page.waitForTimeout(300); // Wait for theme transition

    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match mobile menu snapshot', async ({ page, isMobile }) => {
    if (!isMobile) {
      // Set mobile viewport for desktop browsers
      await page.setViewportSize({ width: 375, height: 667 });
    }

    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(300); // Wait for menu animation

      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      await expect(mobileMenu).toHaveScreenshot('mobile-menu.png', {
        animations: 'disabled',
      });
    }
  });

  test('should match footer snapshot', async ({ page }) => {
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toHaveScreenshot('footer.png', {
      animations: 'disabled',
    });
  });

  test('should match hover states', async ({ page }) => {
    const button = page.locator('button').first();
    await button.hover();
    await page.waitForTimeout(100); // Wait for hover transition

    await expect(button).toHaveScreenshot('button-hover.png', {
      animations: 'disabled',
    });
  });

  test('should match focus states', async ({ page }) => {
    const input = page.locator('input').first();
    await input.focus();

    await expect(input).toHaveScreenshot('input-focus.png', {
      animations: 'disabled',
    });
  });
});

test.describe('Responsive Visual Regression', () => {
  const viewports = [
    { name: 'desktop-4k', width: 3840, height: 2160 },
    { name: 'desktop-1080p', width: 1920, height: 1080 },
    { name: 'laptop', width: 1366, height: 768 },
    { name: 'tablet-landscape', width: 1024, height: 768 },
    { name: 'tablet-portrait', width: 768, height: 1024 },
    { name: 'mobile-large', width: 414, height: 896 },
    { name: 'mobile-medium', width: 375, height: 667 },
    { name: 'mobile-small', width: 320, height: 568 },
  ];

  for (const viewport of viewports) {
    test(`should match ${viewport.name} snapshot`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      await page.goto('/');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`responsive-${viewport.name}.png`, {
        fullPage: false, // Use viewport size
        animations: 'disabled',
      });
    });
  }
});

test.describe('Component Visual Regression', () => {
  test('should match button variants', async ({ page }) => {
    await page.goto('/components'); // Assuming a component showcase page

    const buttonSection = page.locator('[data-testid="button-variants"]');
    await expect(buttonSection).toHaveScreenshot('button-variants.png', {
      animations: 'disabled',
    });
  });

  test('should match form elements', async ({ page }) => {
    await page.goto('/components');

    const formSection = page.locator('[data-testid="form-elements"]');
    await expect(formSection).toHaveScreenshot('form-elements.png', {
      animations: 'disabled',
    });
  });

  test('should match card components', async ({ page }) => {
    await page.goto('/components');

    const cardSection = page.locator('[data-testid="card-components"]');
    await expect(cardSection).toHaveScreenshot('card-components.png', {
      animations: 'disabled',
    });
  });
});
