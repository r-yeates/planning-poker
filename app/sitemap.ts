import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const blogPosts = [
    'planning-poker-basics',
    'common-estimation-mistakes', 
    'remote-planning-poker',
    'fibonacci-vs-tshirt',
    'facilitating-sessions',
    'story-point-calibration'
  ]

  const staticPages = [
    {
      url: 'https://Sprintro.dev',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: 'https://Sprintro.dev/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: 'https://Sprintro.dev/faq',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: 'https://Sprintro.dev/legal',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: 'https://Sprintro.dev/analytics',
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.3,
    },
  ]

  const blogPages = blogPosts.map(slug => ({
    url: `https://Sprintro.dev/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...blogPages]
}
