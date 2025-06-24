import { Metadata } from 'next'
import Link from 'next/link'
import ThemeToggle from '../components/ThemeToggle'

export const metadata: Metadata = {
  title: 'Planning Poker Blog - Tips, Techniques & Best Practices',
  description: 'Discover expert tips, techniques, and best practices for planning poker estimation. Learn how to run effective agile estimation sessions and improve team collaboration.',
  keywords: 'planning poker tips, agile estimation, scrum planning, story points, team estimation, agile best practices',
  openGraph: {
    title: 'Planning Poker Blog - Expert Tips & Best Practices',
    description: 'Expert insights on planning poker, agile estimation, and team collaboration techniques.',
    type: 'website',
  },
}

const blogPosts = [
  {
    id: 'planning-poker-basics',
    title: 'Planning Poker Basics: A Complete Guide for Beginners',
    excerpt: 'Learn the fundamentals of planning poker, from basic rules to advanced techniques for better estimations.',
    date: '2025-06-20',
    readTime: '8 min read',
    tags: ['Basics', 'Getting Started', 'Agile'],
  },
  {
    id: 'common-estimation-mistakes',
    title: '7 Common Planning Poker Mistakes and How to Avoid Them',
    excerpt: 'Discover the most frequent pitfalls teams encounter during estimation sessions and practical solutions.',
    date: '2025-06-18',
    readTime: '6 min read',
    tags: ['Best Practices', 'Mistakes', 'Tips'],
  },
  {
    id: 'remote-planning-poker',
    title: 'Mastering Remote Planning Poker: Tools and Techniques',
    excerpt: 'Essential strategies for running effective planning poker sessions with distributed teams.',
    date: '2025-06-15',
    readTime: '10 min read',
    tags: ['Remote Work', 'Tools', 'Collaboration'],
  },
  {
    id: 'fibonacci-vs-tshirt',
    title: 'Fibonacci vs T-Shirt Sizing: Choosing the Right Scale',
    excerpt: 'Compare different estimation scales and learn when to use each approach for maximum effectiveness.',
    date: '2025-06-12',
    readTime: '7 min read',
    tags: ['Estimation Scales', 'Comparison', 'Methodology'],
  },
  {
    id: 'facilitating-sessions',
    title: 'The Art of Facilitating Planning Poker Sessions',
    excerpt: 'Master the skills needed to run smooth, productive estimation sessions that engage your entire team.',
    date: '2025-06-10',
    readTime: '9 min read',
    tags: ['Facilitation', 'Leadership', 'Team Management'],
  },
  {
    id: 'story-point-calibration',
    title: 'Story Point Calibration: Building Team Consensus',
    excerpt: 'Techniques for helping your team develop a shared understanding of story point values.',
    date: '2025-06-08',
    readTime: '8 min read',
    tags: ['Story Points', 'Team Alignment', 'Calibration'],
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation Header */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <img 
            src="/logo.png" 
            alt="Sprintro Logo" 
            className="w-8 h-8 rounded-lg"
          />
          Sprintro
        </Link>
        
        <div className="flex items-center gap-4">
          <Link
            href="/blog"
            className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            Blog
          </Link>
          <Link
            href="/faq"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            FAQ
          </Link>
          <Link
            href="/analytics"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Planning Poker Blog
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Expert insights, tips, and best practices for agile estimation and team collaboration
          </p>
        </div>

        {/* Featured Post */}
        <div className="mb-12">
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>
            
            <div className="relative z-10">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                  ⭐ Featured
                </span>
                {blogPosts[0].tags.map((tag) => (
                  <span key={tag} className="bg-white/10 backdrop-blur-sm text-white/90 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {blogPosts[0].title}
              </h2>
              <p className="text-xl text-white/90 mb-6 leading-relaxed">
                {blogPosts[0].excerpt}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-white/80">
                  <span>{blogPosts[0].date}</span>
                  <span className="mx-2">•</span>
                  <span>{blogPosts[0].readTime}</span>
                </div>
                <Link 
                  href={`/blog/${blogPosts[0].id}`}
                  className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                  Read Article
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.slice(1).map((post) => (
            <article key={post.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <span>{post.date}</span>
                    <span className="mx-2">•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <Link 
                    href={`/blog/${post.id}`}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Read →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Try Planning Poker?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              Put these tips into practice with our free planning poker tool. Create a room and start estimating with your team in seconds.
            </p>
            <Link 
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors inline-block"
            >
              Start Planning Session
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-700 mt-16 pt-8">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="flex flex-wrap justify-center gap-6 mb-4">
              <Link
                href="/"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/blog"
                className="text-sm text-blue-600 dark:text-blue-400 font-medium"
              >
                Blog
              </Link>
              <Link
                href="/faq"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                FAQ
              </Link>
              <Link
                href="/analytics"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Analytics
              </Link>
              <Link
                href="/legal"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Legal
              </Link>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              © 2025 Sprintro. Free planning poker for agile teams.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
