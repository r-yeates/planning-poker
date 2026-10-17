// Canonical site origin, used for metadata, sitemap, robots and structured data.
// Override per environment with NEXT_PUBLIC_SITE_URL (no trailing slash).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sprintro.dev').replace(/\/$/, '');

export const SITE_NAME = 'Sprintro';

// Served by app/opengraph-image.tsx. Next.js only adds it automatically to pages that don't
// define their own `openGraph`, so pages that do must include `images: [DEFAULT_OG_IMAGE]`.
export const DEFAULT_OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'Sprintro: free planning poker for agile teams',
};
