import { Metadata } from 'next'
import Link from 'next/link'
import ThemeToggle from '../components/global/ThemeToggle'

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

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold">
            <span className="text-gray-900 dark:text-white">Expert</span>
            <span className="text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text"> Insights</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto mt-6">
            Master the art of agile estimation with expert tips, techniques, and best practices from seasoned practitioners.
          </p>
        </div>

        {/* Background Pattern */}
        <div className="relative mb-24">
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="h-full">
              <defs>
                <pattern id="dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="5" cy="5" r="1" fill="currentColor"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)"/>
            </svg>
          </div>

          <div className="relative z-10">
            {/* Featured Article */}
            <div className="mb-20">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                Featured <span className="text-blue-600 dark:text-blue-400">Article</span>
              </h2>
              <div className="group relative max-w-4xl mx-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                <Link href={`/blog/${blogPosts[0].id}`}>
                  <div className="relative bg-white dark:bg-gray-900 rounded-3xl border-2 border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 transform hover:scale-105 overflow-hidden">
                    <div className="p-8 md:p-12">
                      <div className="flex flex-wrap gap-3 mb-6">
                        {blogPosts[0].tags.map((tag) => (
                          <span key={tag} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-semibold">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {blogPosts[0].title}
                      </h3>
                      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                        {blogPosts[0].excerpt}
                      </p>
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <span className="font-medium">{blogPosts[0].date}</span>
                        <span className="mx-4">•</span>
                        <span className="font-medium">{blogPosts[0].readTime}</span>
                        <div className="ml-auto flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                          Read Article
                          <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* All Articles Grid */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
                All <span className="text-blue-600 dark:text-blue-400">Articles</span>
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogPosts.map((post, index) => (
                  <div key={post.id} className="group relative h-full">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
                    <Link href={`/blog/${post.id}`}>
                      <div className="relative bg-white dark:bg-gray-900 rounded-3xl border-2 border-gray-100 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 transform hover:scale-105 h-full flex flex-col overflow-hidden">
                        <div className="p-6 md:p-8 flex flex-col h-full">
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-grow">
                            {post.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed flex-grow">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-sm mt-auto">
                            <div className="flex items-center">
                              <span>{post.date}</span>
                              <span className="mx-3">•</span>
                              <span>{post.readTime}</span>
                            </div>
                            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                              Read
                              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-24 text-center">
              <div className="group relative max-w-4xl mx-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                <div className="relative bg-white dark:bg-gray-900 rounded-3xl border-2 border-blue-100 dark:border-blue-900 p-8 md:p-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                    Ready to <span className="text-blue-600 dark:text-blue-400">Start Estimating?</span>
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                    Put these insights into practice. Create your planning poker session and see the difference expert techniques make.
                  </p>
                  <Link 
                    href="/"
                    className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Planning Session
                  </Link>
                </div>
              </div>
            </div>
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
