import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '../../components/ThemeToggle'

// Blog post data - in a real app, this would come from a CMS or database
const blogPosts = {
  'planning-poker-basics': {
    title: 'Planning Poker Basics: A Complete Guide for Beginners',
    date: '2025-06-20',
    readTime: '8 min read',
    tags: ['Basics', 'Getting Started', 'Agile'],
    excerpt: 'Learn the fundamentals of planning poker, from basic rules to advanced techniques for better estimations.',
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
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-3">✓ Reduces Anchoring</h3>
              <p className="text-green-800 dark:text-green-200">Prevents the first estimate from influencing others</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-3">✓ Encourages Discussion</h3>
              <p className="text-purple-800 dark:text-purple-200">Differences in estimates lead to valuable conversations</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">✓ Engages Everyone</h3>
              <p className="text-blue-800 dark:text-blue-200">All team members participate in the estimation process</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6">
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
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400">→</span>
                <span className="text-gray-700 dark:text-gray-300">Gather your development team (3-9 people works best)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400">→</span>
                <span className="text-gray-700 dark:text-gray-300">Prepare your user stories with clear acceptance criteria</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400">→</span>
                <span className="text-gray-700 dark:text-gray-300">Choose your estimation scale (we recommend Fibonacci)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400">→</span>
                <span className="text-gray-700 dark:text-gray-300">Start with a simple story to calibrate the team</span>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Common Pitfalls to Avoid</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-r-lg">
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">Don't discuss estimates before revealing</h3>
              <p className="text-red-800 dark:text-red-200">This defeats the purpose of avoiding anchoring bias</p>
            </div>
            <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-r-lg">
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Avoid turning estimates into time commitments</h3>
              <p className="text-orange-800 dark:text-orange-200">Planning poker estimates relative complexity, not precise duration</p>
            </div>
            <div className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-r-lg">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Don't average different estimates</h3>
              <p className="text-yellow-800 dark:text-yellow-200">Use discussion to understand the differences and reach true consensus</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Next Steps</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            Ready to put these concepts into practice? Start your first planning poker session and experience the benefits of collaborative estimation.
          </p>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">🚀 Try it yourself!</h3>
            <p className="mb-4">Our free planning poker tool makes it easy to run sessions with your team, whether you're co-located or distributed.</p>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Start a Session
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </section>
      </div>
    )
  },
  // Add other blog posts here...
  'common-estimation-mistakes': {
    title: '7 Common Planning Poker Mistakes and How to Avoid Them',
    date: '2025-06-18',
    readTime: '6 min read',
    tags: ['Best Practices', 'Mistakes', 'Tips'],
    excerpt: 'Discover the most frequent pitfalls teams encounter during estimation sessions and practical solutions.',
    content: () => (
      <div className="space-y-8">
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Introduction</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            Even experienced teams can fall into common traps when using planning poker. Here are the seven most frequent mistakes and how to avoid them.
          </p>
        </section>
        
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Mistake #1: Revealing Cards Too Early</h2>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 mb-6">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              <strong>The Problem:</strong> Team members show their cards before everyone has made their estimate, leading to anchoring bias.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>The Solution:</strong> Use a digital tool or designate a facilitator to ensure simultaneous reveals.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Mistake #2: Skipping the Discussion</h2>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 mb-6">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              <strong>The Problem:</strong> Teams immediately re-estimate without discussing why estimates differ.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>The Solution:</strong> Always discuss the highest and lowest estimates before the next round.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Key Takeaways</h2>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span className="text-gray-700 dark:text-gray-300">Always reveal estimates simultaneously</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span className="text-gray-700 dark:text-gray-300">Focus on discussion, not speed</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span className="text-gray-700 dark:text-gray-300">Keep estimates relative to story points</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span className="text-gray-700 dark:text-gray-300">Remember that estimates are not commitments</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    )
  }
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = blogPosts[slug as keyof typeof blogPosts]
  
  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: `${post.title} | Scrint Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
    },
  }
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const post = blogPosts[slug as keyof typeof blogPosts]

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Background Pattern */}
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

      {/* Navigation Header */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <img 
            src="/logo.png" 
            alt="Scrint Logo" 
            className="w-8 h-8 rounded-lg"
          />
          Scrint
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

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link href="/blog" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            ← Back to Blog
          </Link>
        </nav>

        {/* Article Header */}
        <header className="mb-12">
          <div className="flex flex-wrap gap-3 mb-6">
            {post.tags.map((tag) => (
              <span key={tag} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-semibold">
                {tag}
              </span>
            ))}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gray-900 dark:text-white">{post.title.split(' ').slice(0, -3).join(' ')}</span>
            <span className="text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text"> {post.title.split(' ').slice(-3).join(' ')}</span>
          </h1>
          
          <div className="flex items-center text-gray-500 dark:text-gray-400 text-lg">
            <span className="font-medium">{post.date}</span>
            <span className="mx-4">•</span>
            <span className="font-medium">{post.readTime}</span>
          </div>
        </header>

        {/* Article Content */}
        <article className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl blur-xl"></div>
          <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/50 p-8 md:p-12 shadow-2xl">
            <div className="prose prose-lg prose-blue dark:prose-invert max-w-none">
              <post.content />
            </div>
          </div>
        </article>

        {/* CTA Section */}
        <section className="mt-16">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative bg-white dark:bg-gray-900 rounded-3xl border-2 border-blue-100 dark:border-blue-900 p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Ready to <span className="text-blue-600 dark:text-blue-400">Start Estimating?</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                Put these insights into practice. Create your planning poker session and see the difference expert techniques make.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/"
                  className="inline-flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Planning Session
                </Link>
                <Link 
                  href="/blog"
                  className="inline-flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-8 py-4 rounded-2xl font-semibold transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  Read More Articles
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 dark:border-gray-700 mt-16 pt-8">
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
          <p className="text-xs text-gray-400 dark:text-gray-500 pb-8">
            © 2025 Scrint. Free planning poker for agile teams.
          </p>
        </div>
      </footer>
    </div>
  )
}