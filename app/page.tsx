import type { Metadata } from 'next';
import HomeClient from './components/home/HomeClient';
import HomeContent, { HOME_FAQS } from './components/home/HomeContent';
import { SITE_NAME, SITE_URL } from '@/lib/site';

// Title, description and share tags are inherited from app/layout.tsx
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

// Rendered on the server so crawlers get it in the initial HTML
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#org`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}/#org` },
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#app`,
      name: `${SITE_NAME} Planning Poker`,
      alternateName: [SITE_NAME, 'Scrum Poker'],
      url: SITE_URL,
      description:
        'Free online planning poker (scrum poker) tool for agile teams. Estimate story points in real time with anonymous voting and no signup.',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'Real-time collaborative estimation',
        'Anonymous voting',
        'Fibonacci, modified Fibonacci, powers of two and T-shirt scales',
        'Vote distribution statistics',
        'Room templates',
        'Password-protected rooms',
        'No signup required',
      ],
      publisher: { '@id': `${SITE_URL}/#org` },
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
      mainEntity: HOME_FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <HomeClient>
        <HomeContent />
      </HomeClient>
    </>
  );
}
