import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '../../components/ThemeToggle'

// Blog post data - in a real app, this would come from a CMS or database
const blogPosts = {
  'planning-poker-basics': {
    title: 'Planning Poker Basics: A Complete Guide for Beginners',
    content: () => (
      <div className="space-y-8">
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">What is Planning Poker?</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            Planning poker is a consensus-based estimation technique used in agile software development. It combines expert opinion, analogy, and disagreement to create accurate estimates for user stories and features.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">How It Works</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            Team members select cards representing their estimates for the effort required to complete a user story. Cards typically use the Fibonacci sequence (1, 2, 3, 5, 8, 13, 21) to reflect the uncertainty in larger estimates.
          </p>
          
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">The Process:</h3>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-6">
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Present the Story:</strong>
                  <span className="text-gray-700 dark:text-gray-300 ml-2">The product owner or scrum master explains the user story</span>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Ask Questions:</strong>
                  <span className="text-gray-700 dark:text-gray-300 ml-2">Team members clarify requirements and assumptions</span>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Estimate Privately:</strong>
                  <span className="text-gray-700 dark:text-gray-300 ml-2">Each member selects a card without revealing it</span>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Reveal Simultaneously:</strong>
                  <span className="text-gray-700 dark:text-gray-300 ml-2">All cards are shown at once</span>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">5</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Discuss Differences:</strong>
                  <span className="text-gray-700 dark:text-gray-300 ml-2">Focus on the highest and lowest estimates</span>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">6</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Re-estimate:</strong>
                  <span className="text-gray-700 dark:text-gray-300 ml-2">Repeat until consensus is reached</span>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Benefits of Planning Poker</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-3">✓ Reduces Anchoring</h3>
              <p className="text-green-800 dark:text-green-200">Prevents the first estimate from influencing others</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-3">✓ Encourages Discussion</h3>
              <p className="text-purple-800 dark:text-purple-200">Differences in estimates lead to valuable conversations</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">✓ Engages Everyone</h3>
              <p className="text-blue-800 dark:text-blue-200">All team members participate in the estimation process</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-semibold text-orange-900 dark:text-orange-100 mb-3">✓ Improves Accuracy</h3>
              <p className="text-orange-800 dark:text-orange-200">Collective wisdom often beats individual estimates</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Getting Started</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            To run your first planning poker session:
          </p>
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold">1.</span>
                <span className="text-gray-700 dark:text-gray-300">Gather your development team (5-9 people work best)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold">2.</span>
                <span className="text-gray-700 dark:text-gray-300">Prepare a backlog of user stories</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold">3.</span>
                <span className="text-gray-700 dark:text-gray-300">Choose an estimation scale (Fibonacci is most common)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold">4.</span>
                <span className="text-gray-700 dark:text-gray-300">Set up your planning poker tool</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold">5.</span>
                <span className="text-gray-700 dark:text-gray-300">Start with a reference story everyone understands</span>
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Common Pitfalls to Avoid</h2>
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-xl p-6">
            <h3 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-4">⚠️ Watch Out For:</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-red-600 dark:text-red-400">•</span>
                <span className="text-red-800 dark:text-red-200">Don't rush the discussion phase</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-600 dark:text-red-400">•</span>
                <span className="text-red-800 dark:text-red-200">Avoid averaging different estimates</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-600 dark:text-red-400">•</span>
                <span className="text-red-800 dark:text-red-200">Don't estimate stories that are too large (split them first)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-600 dark:text-red-400">•</span>
                <span className="text-red-800 dark:text-red-200">Keep sessions to 2 hours maximum</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    ),
    date: '2025-06-20',
    readTime: '8 min read',
    tags: ['Basics', 'Getting Started', 'Agile'],
  },
  // ... other blog posts with similar styling updates
}

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  return Object.keys(blogPosts).map((slug) => ({
    slug,
  }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = blogPosts[params.slug as keyof typeof blogPosts]
  
  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  const descriptions = {
    'planning-poker-basics': 'Learn the fundamentals of planning poker, from basic rules to advanced techniques for better estimations.',
    'common-estimation-mistakes': 'Discover the most frequent pitfalls teams encounter during estimation sessions and practical solutions.',
    'remote-planning-poker': 'Essential strategies for running effective planning poker sessions with distributed teams.',
    'fibonacci-vs-tshirt': 'Compare different estimation scales and learn when to use each approach for maximum effectiveness.',
    'facilitating-sessions': 'Master the skills needed to run smooth, productive estimation sessions that engage your entire team.',
    'story-point-calibration': 'Techniques for helping your team develop a shared understanding of story point values.',
  }

  const description = descriptions[params.slug as keyof typeof descriptions] || post.title

  return {
    title: `${post.title} | Sprintro Blog`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      publishedTime: post.date,
      tags: post.tags,
    },
    keywords: post.tags.join(', '),
  }
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = blogPosts[params.slug as keyof typeof blogPosts]

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 dark:opacity-10 pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="h-full">
          <defs>
            <pattern id="blog-dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#blog-dots)" />
        </svg>
      </div>

      {/* Navigation Header */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
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

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8">
          <Link 
            href="/blog"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium hover:scale-105 transform duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>
        </nav>

        {/* Article Header */}
        <header className="mb-12 text-center">
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {post.tags.map((tag) => (
              <span 
                key={tag} 
                className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-800 hover:scale-105 transition-transform duration-200"
              >
                {tag}
              </span>
            ))}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-gray-900 dark:text-white">{post.title.split(':')[0]}</span>
            {post.title.includes(':') && (
              <>
                <span className="text-gray-900 dark:text-white">:</span>
                <span className="text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text"> {post.title.split(':')[1]}</span>
              </>
            )}
          </h1>
          
          <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 mb-8 gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{post.date}</span>
            </div>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{post.readTime}</span>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <article className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8 md:p-12 mb-16 hover:shadow-3xl transition-all duration-500">
          <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-h2:text-3xl prose-h3:text-2xl prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white">
            {typeof post.content === 'function' ? (
              <post.content />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            )}
          </div>
        </article>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8 md:p-12 hover:shadow-3xl transition-all duration-500">
            <div className="relative">
              {/* Gradient decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl blur-xl"></div>
              
              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  <span className="text-gray-900 dark:text-white">Ready to</span>
                  <span className="text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text"> Apply This?</span>
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                  Start your own planning poker session and put these techniques into practice with your team.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    href="/"
                    className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-blue-500/25"
                  >
                    <span className="flex items-center gap-2">
                      Start Planning Session
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </Link>
                  <Link 
                    href="/blog"
                    className="group bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                      Read More Articles
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-700 mt-16 pt-8">
          <div className="text-center">
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
