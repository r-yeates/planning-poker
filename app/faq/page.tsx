import { Metadata } from 'next'
import Link from 'next/link'
import ThemeToggle from '../components/global/ThemeToggle'

export const metadata: Metadata = {
  title: 'Planning Poker FAQ - Frequently Asked Questions',
  description: 'Get answers to common questions about planning poker, agile estimation, story points, and running effective estimation sessions.',
  keywords: 'planning poker FAQ, agile estimation questions, story points explained, planning poker help, estimation techniques',
  openGraph: {
    title: 'Planning Poker FAQ - Your Questions Answered',
    description: 'Find answers to the most common questions about planning poker and agile estimation.',
    type: 'website',
  },
}

const faqCategories = [
  {
    title: 'Getting Started',
    questions: [
      {
        question: 'What is planning poker?',
        answer: 'Planning poker is a consensus-based estimation technique used in agile software development. Team members use cards to estimate the effort required for user stories, promoting discussion and reducing bias.'
      },
      {
        question: 'How many people should participate in planning poker?',
        answer: 'The ideal team size is 5-9 people. This includes developers, testers, and anyone who will work on the stories. Fewer than 5 may lack diverse perspectives, while more than 9 can become unwieldy.'
      },
      {
        question: 'What estimation scale should we use?',
        answer: 'The Fibonacci sequence (1, 2, 3, 5, 8, 13, 21) is most popular because it reflects increasing uncertainty in larger estimates. T-shirt sizes (S, M, L, XL) work well for new teams or high-level planning.'
      },
      {
        question: 'How long should a planning poker session last?',
        answer: 'Keep sessions to 2 hours maximum. Take breaks every 45-60 minutes to maintain focus. If you need longer, split into multiple sessions.'
      }
    ]
  },
  {
    title: 'Story Points & Estimation',
    questions: [
      {
        question: 'What are story points?',
        answer: 'Story points are a unit of measure for expressing the relative effort required to implement a user story. They consider complexity, effort, and uncertainty, not time.'
      },
      {
        question: 'How do story points relate to time?',
        answer: 'Story points don\'t directly convert to time. A 5-point story might take different amounts of time depending on the team member working on it. Focus on relative sizing between stories.'
      },
      {
        question: 'Should we include testing and bug fixing in our estimates?',
        answer: 'Yes, include all work required to complete the story according to your definition of done. This typically includes development, testing, code review, and any necessary documentation.'
      },
      {
        question: 'What if estimates vary widely between team members?',
        answer: 'Wide variations indicate different understandings of the story. This is valuable! Discuss the differences, especially between the highest and lowest estimates, then re-estimate.'
      }
    ]
  },
  {
    title: 'Process & Best Practices',
    questions: [
      {
        question: 'What happens if we can\'t reach consensus?',
        answer: 'If discussion isn\'t resolving differences, consider: splitting the story into smaller pieces, seeking more information from stakeholders, or parking the story for later research.'
      },
      {
        question: 'Should the Product Owner participate in estimation?',
        answer: 'The Product Owner should present stories and answer questions but typically shouldn\'t estimate since they don\'t do the development work. However, practices vary by team.'
      },
      {
        question: 'How do we handle technical debt in our estimates?',
        answer: 'Include necessary refactoring work in your estimates. If significant technical debt affects multiple stories, consider creating dedicated technical debt stories.'
      },
      {
        question: 'Can we change estimates after a sprint starts?',
        answer: 'Original estimates should remain unchanged for velocity tracking. If scope changes, create new stories. Use estimation changes as learning opportunities for future planning.'
      }
    ]
  },
  {
    title: 'Remote & Tools',
    questions: [
      {
        question: 'How do we run planning poker remotely?',
        answer: 'Use digital planning poker tools, video conferencing with cameras on, and maintain extra engagement techniques like frequent check-ins and clear facilitation.'
      },
      {
        question: 'What features should I look for in a planning poker tool?',
        answer: 'Key features include: real-time synchronization, multiple estimation scales, timer functionality, result export, mobile compatibility, and easy room sharing.'
      },
      {
        question: 'Should we use physical cards or digital tools?',
        answer: 'Physical cards work great for co-located teams and can feel more engaging. Digital tools are essential for remote teams and offer additional features like automatic result tracking.'
      },
      {
        question: 'How do we handle different time zones?',
        answer: 'Find overlapping hours that work for everyone, rotate meeting times if needed, or use asynchronous estimation for less critical stories. Record sessions for those who can\'t attend.'
      }
    ]
  },
  {
    title: 'Common Challenges',
    questions: [
      {
        question: 'What if one person dominates the discussion?',
        answer: 'Use facilitation techniques like round-robin questioning, direct questions to quieter members, and time-boxing discussions. Remind the team that all perspectives are valuable.'
      },
      {
        question: 'How do we estimate when requirements are unclear?',
        answer: 'Don\'t estimate unclear stories. Instead, add a "spike" story to research and clarify requirements first. Estimation requires sufficient understanding of the work involved.'
      },
      {
        question: 'What if our estimates are consistently wrong?',
        answer: 'Track estimation accuracy over time. Look for patterns - are you consistently over or under estimating? Adjust your reference stories and consider external factors affecting your work.'
      },
      {
        question: 'Should new team members participate in estimation?',
        answer: 'Yes, but pair them with experienced team members initially. Their fresh perspective can be valuable, and participation helps them learn the codebase and team standards.'
      }
    ]
  },
  {
    title: 'Velocity & Planning',
    questions: [
      {
        question: 'What is velocity and how is it calculated?',
        answer: 'Velocity is the sum of story points completed in a sprint. Track it over 3-5 sprints to establish a baseline for planning future sprints.'
      },
      {
        question: 'Should we try to improve our velocity?',
        answer: 'Velocity is a planning tool, not a performance metric. Focus on delivering value, improving quality, and team happiness. Velocity may naturally increase as the team matures.'
      },
      {
        question: 'How do we handle partially completed stories?',
        answer: 'Don\'t count partial points in velocity calculations. Either complete the story or don\'t count it. This maintains the integrity of your velocity measurements.'
      },
      {
        question: 'Can we compare velocities between different teams?',
        answer: 'No, velocity is team-specific. Each team has different skills, technology stacks, and story point calibration. Use velocity only for planning within the same team.'
      }
    ]
  }
]

export default function FAQPage() {
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
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            Blog
          </Link>
          <Link
            href="/faq"
            className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 font-medium"
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
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Get answers to common questions about planning poker, agile estimation, and running effective sessions
          </p>
        </div>

        {/* Quick Links */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Navigation</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {faqCategories.map((category, index) => (
              <a
                key={index}
                href={`#${category.title.toLowerCase().replace(/ /g, '-')}`}
                className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <h3 className="font-medium text-gray-900 dark:text-white">{category.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{category.questions.length} questions</p>
              </a>
            ))}
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-12">
          {faqCategories.map((category, categoryIndex) => (
            <section 
              key={categoryIndex}
              id={category.title.toLowerCase().replace(/ /g, '-')}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                {category.title}
              </h2>
              
              <div className="space-y-6">
                {category.questions.map((faq, faqIndex) => (
                  <div key={faqIndex} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Still Have Questions Section */}
        <div className="text-center mt-16">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Still Have Questions?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Didn't find what you were looking for? Check out our comprehensive blog articles for detailed guides and best practices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/blog"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Read Our Blog
              </Link>
              <Link 
                href="/"
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Try Planning Poker
              </Link>
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
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/faq"
                className="text-sm text-blue-600 dark:text-blue-400 font-medium"
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
