import { Metadata } from 'next'
import Link from 'next/link'

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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                Featured
              </span>
              {blogPosts[0].tags.map((tag) => (
                <span key={tag} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {blogPosts[0].title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
              {blogPosts[0].excerpt}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span>{blogPosts[0].date}</span>
                <span className="mx-2">•</span>
                <span>{blogPosts[0].readTime}</span>
              </div>
              <Link 
                href={`/blog/${blogPosts[0].id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Read Article
              </Link>
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
      </div>
    </div>
  )
}
