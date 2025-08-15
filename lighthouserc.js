module.exports = {
  ci: {
    collect: {
      startServerCommand: 'bun dev:web',
      startServerReadyPattern: 'ready on',
      url: ['http://localhost:3001', 'http://localhost:3001/chat'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.9 }],

        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-meaningful-paint': ['error', { maxNumericValue: 2000 }],
        'speed-index': ['error', { maxNumericValue: 3400 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        interactive: ['error', { maxNumericValue: 3800 }],

        // Bundle size budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 500_000 }], // 500KB
        'resource-summary:stylesheet:size': [
          'error',
          { maxNumericValue: 100_000 },
        ], // 100KB
        'resource-summary:image:size': ['warn', { maxNumericValue: 2_000_000 }], // 2MB
        'resource-summary:total:size': [
          'error',
          { maxNumericValue: 3_000_000 },
        ], // 3MB

        // Request counts
        'resource-summary:script:count': ['warn', { maxNumericValue: 10 }],
        'resource-summary:stylesheet:count': ['warn', { maxNumericValue: 5 }],
        'resource-summary:third-party:count': ['warn', { maxNumericValue: 5 }],

        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        label: 'error',
        tabindex: 'error',
        'meta-viewport': 'error',

        // Best practices
        'errors-in-console': 'error',
        'no-vulnerable-libraries': 'error',
        'js-libraries': 'warn',
        'uses-http2': 'warn',
        'uses-passive-event-listeners': 'error',

        // SEO
        'document-title': 'error',
        'meta-description': 'error',
        'http-status-code': 'error',
        'is-crawlable': 'error',
        'robots-txt': 'warn',
        hreflang: 'warn',
        canonical: 'warn',

        // PWA
        'service-worker': 'warn',
        'installable-manifest': 'warn',
        'apple-touch-icon': 'warn',
        'splash-screen': 'warn',
        'themed-omnibox': 'warn',
        'content-width': 'error',
        viewport: 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
