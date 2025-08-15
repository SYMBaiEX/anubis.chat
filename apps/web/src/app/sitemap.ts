import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://anubis.chat';
  const lastModified = new Date();

  // Define pages with specific priorities and change frequencies
  const pages: Array<{
    path: string;
    changeFrequency:
      | 'always'
      | 'hourly'
      | 'daily'
      | 'weekly'
      | 'monthly'
      | 'yearly'
      | 'never';
    priority: number;
  }> = [
    { path: '', changeFrequency: 'daily', priority: 1.0 },
    { path: 'chat', changeFrequency: 'hourly', priority: 0.9 },
    { path: 'agents', changeFrequency: 'daily', priority: 0.8 },
    { path: 'workflows', changeFrequency: 'weekly', priority: 0.8 },
    { path: 'mcp', changeFrequency: 'weekly', priority: 0.7 },
    { path: 'dashboard', changeFrequency: 'daily', priority: 0.8 },
    { path: 'book-of-the-dead', changeFrequency: 'weekly', priority: 0.6 },
    { path: 'roadmap', changeFrequency: 'weekly', priority: 0.7 },
    { path: 'subscription', changeFrequency: 'monthly', priority: 0.7 },
    { path: 'referral-info', changeFrequency: 'monthly', priority: 0.5 },
    { path: 'legal/terms', changeFrequency: 'monthly', priority: 0.3 },
    { path: 'legal/privacy', changeFrequency: 'monthly', priority: 0.3 },
    { path: 'legal/cookies', changeFrequency: 'monthly', priority: 0.3 },
  ];

  const makeUrl = (path: string) => (path ? `${baseUrl}/${path}` : baseUrl);

  return pages.map(({ path, changeFrequency, priority }) => ({
    url: makeUrl(path),
    lastModified,
    changeFrequency,
    priority,
  }));
}
