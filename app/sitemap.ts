import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Update these dates when the page content actually changes; a lastModified that
// changes on every build teaches Google to ignore it.
const blogPosts = [
  { slug: 'planning-poker-basics', date: '2025-06-20' },
  { slug: 'common-estimation-mistakes', date: '2025-06-18' },
  { slug: 'remote-planning-poker', date: '2025-06-15' },
  { slug: 'fibonacci-vs-tshirt', date: '2025-06-12' },
  { slug: 'facilitating-sessions', date: '2025-06-10' },
  { slug: 'story-point-calibration', date: '2025-06-08' },
]

const latestPost = blogPosts.map(p => p.date).sort().at(-1)

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: '2026-10-17',
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: latestPost,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/faq`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/legal`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  const blogPages: MetadataRoute.Sitemap = blogPosts.map(({ slug, date }) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: date,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticPages, ...blogPages]
}
