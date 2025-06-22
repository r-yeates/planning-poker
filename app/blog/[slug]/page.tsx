import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

// Blog post data - in a real app, this would come from a CMS or database
const blogPosts = {
  'planning-poker-basics': {
    title: 'Planning Poker Basics: A Complete Guide for Beginners',
    content: `
      <h2>What is Planning Poker?</h2>
      <p>Planning poker is a consensus-based estimation technique used in agile software development. It combines expert opinion, analogy, and disagreement to create accurate estimates for user stories and features.</p>
      
      <h2>How It Works</h2>
      <p>Team members select cards representing their estimates for the effort required to complete a user story. Cards typically use the Fibonacci sequence (1, 2, 3, 5, 8, 13, 21) to reflect the uncertainty in larger estimates.</p>
      
      <h3>The Process:</h3>
      <ol>
        <li><strong>Present the Story:</strong> The product owner or scrum master explains the user story</li>
        <li><strong>Ask Questions:</strong> Team members clarify requirements and assumptions</li>
        <li><strong>Estimate Privately:</strong> Each member selects a card without revealing it</li>
        <li><strong>Reveal Simultaneously:</strong> All cards are shown at once</li>
        <li><strong>Discuss Differences:</strong> Focus on the highest and lowest estimates</li>
        <li><strong>Re-estimate:</strong> Repeat until consensus is reached</li>
      </ol>
      
      <h2>Benefits of Planning Poker</h2>
      <ul>
        <li><strong>Reduces Anchoring:</strong> Prevents the first estimate from influencing others</li>
        <li><strong>Encourages Discussion:</strong> Differences in estimates lead to valuable conversations</li>
        <li><strong>Engages Everyone:</strong> All team members participate in the estimation process</li>
        <li><strong>Improves Accuracy:</strong> Collective wisdom often beats individual estimates</li>
      </ul>
      
      <h2>Getting Started</h2>
      <p>To run your first planning poker session:</p>
      <ol>
        <li>Gather your development team (5-9 people work best)</li>
        <li>Prepare a backlog of user stories</li>
        <li>Choose an estimation scale (Fibonacci is most common)</li>
        <li>Set up your planning poker tool</li>
        <li>Start with a reference story everyone understands</li>
      </ol>
      
      <h2>Common Pitfalls to Avoid</h2>
      <ul>
        <li>Don't rush the discussion phase</li>
        <li>Avoid averaging different estimates</li>
        <li>Don't estimate stories that are too large (split them first)</li>
        <li>Keep sessions to 2 hours maximum</li>
      </ul>
    `,
    date: '2025-06-20',
    readTime: '8 min read',
    tags: ['Basics', 'Getting Started', 'Agile'],
  },
  'common-estimation-mistakes': {
    title: '7 Common Planning Poker Mistakes and How to Avoid Them',
    content: `
      <h2>1. Anchoring on the First Estimate</h2>
      <p>When someone shares their estimate before the reveal, it influences everyone else's thinking. Always keep estimates private until the simultaneous reveal.</p>
      
      <h2>2. Averaging Different Estimates</h2>
      <p>When estimates differ significantly, don't just average them. The differences indicate important unknowns that need discussion.</p>
      
      <h2>3. Estimating Too Quickly</h2>
      <p>Rushing through stories without proper discussion defeats the purpose. Take time to understand requirements and share different perspectives.</p>
      
      <h2>4. Including Non-Development Work</h2>
      <p>Planning poker estimates should focus on development effort. Don't include testing, deployment, or other activities unless they're part of your definition of done.</p>
      
      <h2>5. Using Estimates as Commitments</h2>
      <p>Estimates are not promises. They're best guesses based on current understanding. Treat them as such.</p>
      
      <h2>6. Estimating Stories That Are Too Large</h2>
      <p>Epic-sized stories are hard to estimate accurately. Break them down into smaller, more manageable pieces first.</p>
      
      <h2>7. Not Involving the Right People</h2>
      <p>Include everyone who will work on the story. Missing perspectives lead to incomplete estimates.</p>
      
      <h2>Best Practices</h2>
      <ul>
        <li>Keep sessions to 2 hours maximum</li>
        <li>Take breaks every 45-60 minutes</li>
        <li>Start with a reference story everyone knows</li>
        <li>Focus on relative sizing, not absolute time</li>
        <li>Record assumptions made during estimation</li>
      </ul>
    `,
    date: '2025-06-18',
    readTime: '6 min read',
    tags: ['Best Practices', 'Mistakes', 'Tips'],
  },
  'remote-planning-poker': {
    title: 'Mastering Remote Planning Poker: Tools and Techniques',
    content: `
      <h2>The Remote Challenge</h2>
      <p>Remote planning poker requires different strategies than in-person sessions. Without physical presence, you need to work harder to maintain engagement and ensure everyone participates.</p>
      
      <h2>Essential Tools</h2>
      <h3>Video Conferencing</h3>
      <ul>
        <li>Use video calls to maintain visual connection</li>
        <li>Ensure everyone has their camera on</li>
        <li>Use screen sharing for story details</li>
      </ul>
      
      <h3>Digital Planning Poker Tools</h3>
      <ul>
        <li>Web-based estimation tools (like Scrint!)</li>
        <li>Real-time synchronization</li>
        <li>Mobile-friendly interfaces</li>
      </ul>
      
      <h2>Remote Best Practices</h2>
      
      <h3>Before the Session</h3>
      <ul>
        <li>Share user stories in advance</li>
        <li>Test all technology beforehand</li>
        <li>Send calendar invites with tool links</li>
        <li>Prepare backup communication channels</li>
      </ul>
      
      <h3>During the Session</h3>
      <ul>
        <li>Start with a quick check-in round</li>
        <li>Use the "popcorn" method for questions</li>
        <li>Take more frequent breaks</li>
        <li>Actively encourage participation</li>
      </ul>
      
      <h3>Managing Time Zones</h3>
      <ul>
        <li>Find overlapping hours that work for everyone</li>
        <li>Rotate meeting times if needed</li>
        <li>Record sessions for those who can't attend</li>
        <li>Use asynchronous estimation for non-critical stories</li>
      </ul>
      
      <h2>Keeping Everyone Engaged</h2>
      <ul>
        <li>Use breakout rooms for side discussions</li>
        <li>Implement a "raise hand" system</li>
        <li>Ask specific people for input</li>
        <li>Use polls and reactions to gauge understanding</li>
      </ul>
      
      <h2>Technology Tips</h2>
      <ul>
        <li>Have backup internet connections</li>
        <li>Use headphones to avoid echo</li>
        <li>Mute when not speaking</li>
        <li>Keep phone numbers handy for backup</li>
      </ul>
    `,
    date: '2025-06-15',
    readTime: '10 min read',
    tags: ['Remote Work', 'Tools', 'Collaboration'],
  },
  'fibonacci-vs-tshirt': {
    title: 'Fibonacci vs T-Shirt Sizing: Choosing the Right Scale',
    content: `
      <h2>Understanding Estimation Scales</h2>
      <p>The scale you choose for planning poker significantly impacts your team's estimation accuracy and comfort. Let's explore the most popular options.</p>
      
      <h2>Fibonacci Sequence (1, 2, 3, 5, 8, 13, 21)</h2>
      
      <h3>Pros:</h3>
      <ul>
        <li><strong>Reflects Uncertainty:</strong> Larger gaps match increased uncertainty in bigger tasks</li>
        <li><strong>Prevents False Precision:</strong> You can't estimate something as 11 points</li>
        <li><strong>Industry Standard:</strong> Most widely used in agile teams</li>
        <li><strong>Mathematical Basis:</strong> Based on natural patterns</li>
      </ul>
      
      <h3>Cons:</h3>
      <ul>
        <li>Can be confusing for new teams</li>
        <li>Abstract numbers don't mean much initially</li>
        <li>Requires calibration period</li>
      </ul>
      
      <h2>T-Shirt Sizing (XS, S, M, L, XL, XXL)</h2>
      
      <h3>Pros:</h3>
      <ul>
        <li><strong>Intuitive:</strong> Everyone understands relative sizes</li>
        <li><strong>Quick to Learn:</strong> No mathematical concepts needed</li>
        <li><strong>Less Intimidating:</strong> Feels less precise and formal</li>
        <li><strong>Good for High-Level:</strong> Perfect for epic or feature estimation</li>
      </ul>
      
      <h3>Cons:</h3>
      <ul>
        <li>Can be too coarse for detailed estimation</li>
        <li>Teams may want to add sizes (M+, L-, etc.)</li>
        <li>Harder to convert to velocity calculations</li>
      </ul>
      
      <h2>Other Popular Scales</h2>
      
      <h3>Powers of 2 (1, 2, 4, 8, 16, 32)</h3>
      <ul>
        <li>Good for technical teams</li>
        <li>Clear doubling pattern</li>
        <li>Works well for capacity planning</li>
      </ul>
      
      <h3>Linear (1, 2, 3, 4, 5, 6, 7, 8)</h3>
      <ul>
        <li>Simple and straightforward</li>
        <li>Can lead to false precision</li>
        <li>Better for very experienced teams</li>
      </ul>
      
      <h2>Choosing the Right Scale</h2>
      
      <h3>Use Fibonacci When:</h3>
      <ul>
        <li>Your team is experienced with agile</li>
        <li>You need detailed sprint planning</li>
        <li>You track velocity metrics</li>
        <li>Stories vary significantly in size</li>
      </ul>
      
      <h3>Use T-Shirt Sizing When:</h3>
      <ul>
        <li>New to agile estimation</li>
        <li>Doing high-level roadmap planning</li>
        <li>Team finds numbers intimidating</li>
        <li>Estimating epics or features</li>
      </ul>
      
      <h2>Making the Switch</h2>
      <p>If you want to change scales:</p>
      <ol>
        <li>Discuss with the team first</li>
        <li>Do a few practice sessions</li>
        <li>Re-baseline your reference stories</li>
        <li>Give it at least 3 sprints before judging</li>
      </ol>
    `,
    date: '2025-06-12',
    readTime: '7 min read',
    tags: ['Estimation Scales', 'Comparison', 'Methodology'],
  },
  'facilitating-sessions': {
    title: 'The Art of Facilitating Planning Poker Sessions',
    content: `
      <h2>The Role of the Facilitator</h2>
      <p>A good facilitator makes the difference between a productive estimation session and a frustrating waste of time. Your job is to guide the process, not influence the estimates.</p>
      
      <h2>Pre-Session Preparation</h2>
      
      <h3>Story Preparation</h3>
      <ul>
        <li>Review stories beforehand for clarity</li>
        <li>Identify stories that need splitting</li>
        <li>Gather any necessary documentation</li>
        <li>Prepare acceptance criteria</li>
      </ul>
      
      <h3>Team Preparation</h3>
      <ul>
        <li>Ensure all relevant team members attend</li>
        <li>Share the agenda in advance</li>
        <li>Set up the estimation tool</li>
        <li>Book a quiet, comfortable space</li>
      </ul>
      
      <h2>Running the Session</h2>
      
      <h3>Opening (10 minutes)</h3>
      <ul>
        <li>Review the agenda and goals</li>
        <li>Remind everyone of the estimation scale</li>
        <li>Establish or review ground rules</li>
        <li>Do a quick warm-up with a reference story</li>
      </ul>
      
      <h3>Story Estimation Process</h3>
      <ol>
        <li><strong>Present the Story:</strong> Read title and description clearly</li>
        <li><strong>Clarify Requirements:</strong> Allow questions and discussion</li>
        <li><strong>Estimate:</strong> Everyone selects cards privately</li>
        <li><strong>Reveal:</strong> Show all estimates simultaneously</li>
        <li><strong>Discuss:</strong> Focus on highest and lowest estimates</li>
        <li><strong>Re-estimate:</strong> Continue until consensus</li>
      </ol>
      
      <h2>Facilitation Techniques</h2>
      
      <h3>Managing Discussions</h3>
      <ul>
        <li><strong>Focus on Outliers:</strong> Ask highest and lowest estimators to explain</li>
        <li><strong>Timebox Discussions:</strong> Set 5-10 minute limits</li>
        <li><strong>Capture Assumptions:</strong> Write down important decisions</li>
        <li><strong>Stay Neutral:</strong> Don't advocate for specific estimates</li>
      </ul>
      
      <h3>Dealing with Challenges</h3>
      
      <h4>Dominating Voices</h4>
      <ul>
        <li>Use round-robin for questions</li>
        <li>Ask quieter members directly</li>
        <li>Set speaking time limits</li>
      </ul>
      
      <h4>Analysis Paralysis</h4>
      <ul>
        <li>Set discussion time limits</li>
        <li>Suggest parking complex issues</li>
        <li>Remind team of the goal</li>
      </ul>
      
      <h4>Wide Estimate Ranges</h4>
      <ul>
        <li>Explore different interpretations</li>
        <li>Consider splitting the story</li>
        <li>Look for hidden complexity</li>
      </ul>
      
      <h2>Keeping Energy High</h2>
      <ul>
        <li>Take breaks every 45-60 minutes</li>
        <li>Vary your facilitation style</li>
        <li>Use humor appropriately</li>
        <li>Celebrate consensus moments</li>
        <li>Keep sessions under 2 hours</li>
      </ul>
      
      <h2>Closing the Session</h2>
      <ul>
        <li>Review what was accomplished</li>
        <li>Document any parking lot items</li>
        <li>Schedule follow-up actions</li>
        <li>Gather feedback on the process</li>
      </ul>
      
      <h2>Continuous Improvement</h2>
      <ul>
        <li>Ask for retrospective feedback</li>
        <li>Track estimation accuracy over time</li>
        <li>Adjust your facilitation style</li>
        <li>Share learnings with other facilitators</li>
      </ul>
    `,
    date: '2025-06-10',
    readTime: '9 min read',
    tags: ['Facilitation', 'Leadership', 'Team Management'],
  },
  'story-point-calibration': {
    title: 'Story Point Calibration: Building Team Consensus',
    content: `
      <h2>Why Calibration Matters</h2>
      <p>Story point calibration ensures your team has a shared understanding of what each point value represents. Without proper calibration, estimates become meaningless and velocity tracking impossible.</p>
      
      <h2>The Calibration Process</h2>
      
      <h3>Step 1: Choose Reference Stories</h3>
      <p>Select 3-5 stories your team has completed that represent different sizes:</p>
      <ul>
        <li><strong>Small (1-2 points):</strong> Simple bug fixes, minor text changes</li>
        <li><strong>Medium (3-5 points):</strong> New form fields, simple features</li>
        <li><strong>Large (8-13 points):</strong> Complex features, integrations</li>
      </ul>
      
      <h3>Step 2: Establish Anchor Points</h3>
      <p>Start with your smallest reference story and assign it 1 or 2 points. Use this as your baseline for all other estimates.</p>
      
      <h3>Step 3: Relative Sizing</h3>
      <p>For each new story, ask: "Is this bigger or smaller than our reference stories?" Compare complexity, not time.</p>
      
      <h2>Calibration Techniques</h2>
      
      <h3>The Wall Method</h3>
      <ol>
        <li>Put reference stories on a wall in order of size</li>
        <li>Place new stories relative to existing ones</li>
        <li>Move stories up or down until everyone agrees</li>
        <li>Assign point values based on position</li>
      </ol>
      
      <h3>Bucket Sorting</h3>
      <ol>
        <li>Create buckets for each point value</li>
        <li>Sort stories into appropriate buckets</li>
        <li>Discuss any that seem out of place</li>
        <li>Adjust until consensus is reached</li>
      </ol>
      
      <h2>Common Calibration Challenges</h2>
      
      <h3>Different Skill Levels</h3>
      <p>Team members with different experience levels may estimate differently:</p>
      <ul>
        <li>Focus on team average, not individual capability</li>
        <li>Consider pair programming for complex stories</li>
        <li>Document assumptions about who will work on what</li>
      </ul>
      
      <h3>Technical Debt</h3>
      <p>Legacy code and technical debt affect estimates:</p>
      <ul>
        <li>Include refactoring effort in estimates</li>
        <li>Track technical debt separately if needed</li>
        <li>Consider creating debt reduction stories</li>
      </ul>
      
      <h3>External Dependencies</h3>
      <p>Dependencies can complicate estimation:</p>
      <ul>
        <li>Estimate only the work your team controls</li>
        <li>Track dependencies separately</li>
        <li>Consider probability of delays</li>
      </ul>
      
      <h2>Maintaining Calibration</h2>
      
      <h3>Regular Reviews</h3>
      <ul>
        <li>Review estimates vs. actual effort monthly</li>
        <li>Identify patterns in over/under estimation</li>
        <li>Adjust reference stories if needed</li>
        <li>Update team understanding</li>
      </ul>
      
      <h3>New Team Members</h3>
      <ul>
        <li>Walk through reference stories</li>
        <li>Explain team's estimation philosophy</li>
        <li>Pair them with experienced estimators</li>
        <li>Give them time to learn the codebase</li>
      </ul>
      
      <h2>Signs You Need Recalibration</h2>
      <ul>
        <li>Velocity becomes unpredictable</li>
        <li>Estimates consistently wrong</li>
        <li>Team members estimate very differently</li>
        <li>Major technology or process changes</li>
      </ul>
      
      <h2>Best Practices</h2>
      <ul>
        <li>Estimate complexity, not time</li>
        <li>Include all work in your definition of done</li>
        <li>Don't change reference stories lightly</li>
        <li>Document your team's estimation standards</li>
        <li>Be patient - calibration takes time</li>
      </ul>
      
      <h2>Tools for Calibration</h2>
      <ul>
        <li>Story mapping boards</li>
        <li>Estimation history tracking</li>
        <li>Reference story libraries</li>
        <li>Team estimation guidelines</li>
      </ul>
    `,
    date: '2025-06-08',
    readTime: '8 min read',
    tags: ['Story Points', 'Team Alignment', 'Calibration'],
  },
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

  return {
    title: `${post.title} | Scrint Blog`,
    description: post.content.substring(0, 160).replace(/<[^>]*>/g, '') + '...',
    openGraph: {
      title: post.title,
      description: post.content.substring(0, 160).replace(/<[^>]*>/g, '') + '...',
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
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Link 
              href="/blog"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Back to Blog
            </Link>
          </nav>

          {/* Article Header */}
          <header className="mb-12">
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span key={tag} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                  {tag}
                </span>
              ))}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {post.title}
            </h1>
            
            <div className="flex items-center text-gray-600 dark:text-gray-400 mb-8">
              <span>{post.date}</span>
              <span className="mx-3">•</span>
              <span>{post.readTime}</span>
            </div>
          </header>

          {/* Article Content */}
          <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
            <div 
              className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to Put This Into Practice?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                Start your own planning poker session and try these techniques with your team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  Start Planning Session
                </Link>
                <Link 
                  href="/blog"
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  Read More Articles
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
