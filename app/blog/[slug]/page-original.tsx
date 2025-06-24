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
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
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
  'common-estimation-mistakes': {
    title: '7 Common Planning Poker Mistakes and How to Avoid Them',
    content: () => (
      <div className="space-y-8">
        <section>
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-8 font-medium">
            Even experienced agile teams can fall into estimation traps. Here are the most common mistakes and how to avoid them.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">1. Anchoring on the First Estimate</h2>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-3">❌ The Problem</h3>
            <p className="text-red-800 dark:text-red-200 mb-4">
              When someone shares their estimate before the reveal, it influences everyone else's thinking.
            </p>
            <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-3">✅ The Solution</h3>
            <p className="text-green-800 dark:text-green-200">
              Always keep estimates private until the simultaneous reveal. Use digital tools that hide votes until everyone has selected.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">2. Averaging Different Estimates</h2>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-3">❌ The Problem</h3>
            <p className="text-red-800 dark:text-red-200 mb-4">
              When estimates differ significantly, teams often just average them to "split the difference."
            </p>
            <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-3">✅ The Solution</h3>
            <p className="text-green-800 dark:text-green-200">
              Differences indicate important unknowns that need discussion. Focus on understanding why estimates vary.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">3. Estimating Too Quickly</h2>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-3">❌ The Problem</h3>
            <p className="text-red-800 dark:text-red-200 mb-4">
              Rushing through stories without proper discussion defeats the purpose of collaborative estimation.
            </p>
            <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-3">✅ The Solution</h3>
            <p className="text-green-800 dark:text-green-200">
              Take time to understand requirements and share different perspectives. Quality over quantity.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Best Practices to Remember</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">⏰ Time Management</h3>
              <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                <li>• Keep sessions to 2 hours maximum</li>
                <li>• Take breaks every 45-60 minutes</li>
                <li>• Set time limits for discussions</li>
              </ul>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-3">🎯 Focus Areas</h3>
              <ul className="space-y-2 text-purple-800 dark:text-purple-200">
                <li>• Start with reference stories</li>
                <li>• Focus on relative sizing</li>
                <li>• Record important assumptions</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    ),
    date: '2025-06-18',
    readTime: '6 min read',
    tags: ['Best Practices', 'Mistakes', 'Tips'],
  },
  'remote-planning-poker': {
    title: 'Mastering Remote Planning Poker: Tools and Techniques',
    content: () => (
      <div className="space-y-8">
        <section>
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-8 font-medium">
            Remote planning poker presents unique challenges, but with the right tools and techniques, distributed teams can estimate as effectively as co-located ones.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">The Remote Challenge</h2>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-r-xl p-6 mb-6">
            <p className="text-lg text-yellow-800 dark:text-yellow-200 leading-relaxed">
              Remote planning poker requires different strategies than in-person sessions. Without physical presence, 
              you need to work harder to maintain engagement and ensure everyone participates.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Essential Tools</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-3">
                📹 Video Conferencing
              </h3>
              <ul className="space-y-3 text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  Use video calls to maintain visual connection
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  Ensure everyone has their camera on
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  Use screen sharing for story details
                </li>
              </ul>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-3">
                🃏 Digital Planning Poker Tools
              </h3>
              <ul className="space-y-3 text-purple-800 dark:text-purple-200">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400">•</span>
                  Web-based estimation tools (like Sprintro!)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400">•</span>
                  Real-time synchronization
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400">•</span>
                  Mobile-friendly interfaces
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Remote Best Practices</h2>
          
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4">📋 Before the Session</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="space-y-2 text-green-800 dark:text-green-200">
                  <li>• Share user stories in advance</li>
                  <li>• Test all technology beforehand</li>
                </ul>
                <ul className="space-y-2 text-green-800 dark:text-green-200">
                  <li>• Send calendar invites with tool links</li>
                  <li>• Prepare backup communication channels</li>
                </ul>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-orange-900 dark:text-orange-100 mb-4">⚡ During the Session</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="space-y-2 text-orange-800 dark:text-orange-200">
                  <li>• Start with a quick check-in round</li>
                  <li>• Use the "popcorn" method for questions</li>
                </ul>
                <ul className="space-y-2 text-orange-800 dark:text-orange-200">
                  <li>• Take more frequent breaks</li>
                  <li>• Actively encourage participation</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Managing Time Zones</h2>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-3">⏰ Scheduling Tips</h3>
                <ul className="space-y-2 text-indigo-800 dark:text-indigo-200">
                  <li>• Find overlapping hours that work for everyone</li>
                  <li>• Rotate meeting times if needed</li>
                  <li>• Record sessions for those who can't attend</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-3">🔄 Alternatives</h3>
                <ul className="space-y-2 text-indigo-800 dark:text-indigo-200">
                  <li>• Use asynchronous estimation for non-critical stories</li>
                  <li>• Break sessions into shorter time blocks</li>
                  <li>• Consider regional sub-teams</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Technology Tips</h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">🔧 Technical Setup</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• Have backup internet connections</li>
                  <li>• Use headphones to avoid echo</li>
                  <li>• Keep phone numbers handy for backup</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">🎯 Engagement</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• Use polls and reactions</li>
                  <li>• Implement a "raise hand" system</li>
                  <li>• Ask specific people for input</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    ),
    date: '2025-06-15',
    readTime: '10 min read',
    tags: ['Remote Work', 'Tools', 'Collaboration'],
  },
  'fibonacci-vs-tshirt': {
    title: 'Fibonacci vs T-Shirt Sizing: Choosing the Right Scale',
    content: () => (
      <div className="space-y-8">
        <section>
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-8 font-medium">
            The estimation scale you choose significantly impacts your team's accuracy and comfort. Let's compare the most popular approaches.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Fibonacci Sequence (1, 2, 3, 5, 8, 13, 21)</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
                ✅ Pros
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 dark:text-green-400 mt-1">📊</span>
                  <div>
                    <strong className="text-green-900 dark:text-green-100">Reflects Uncertainty:</strong>
                    <p className="text-green-800 dark:text-green-200 text-sm mt-1">Larger gaps match increased uncertainty in bigger tasks</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 dark:text-green-400 mt-1">🎯</span>
                  <div>
                    <strong className="text-green-900 dark:text-green-100">Prevents False Precision:</strong>
                    <p className="text-green-800 dark:text-green-200 text-sm mt-1">You can't estimate something as 11 points</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 dark:text-green-400 mt-1">🏆</span>
                  <div>
                    <strong className="text-green-900 dark:text-green-100">Industry Standard:</strong>
                    <p className="text-green-800 dark:text-green-200 text-sm mt-1">Most widely used in agile teams</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
                ⚠️ Cons
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-red-600 dark:text-red-400 mt-1">😕</span>
                  <div>
                    <strong className="text-red-900 dark:text-red-100">Learning Curve:</strong>
                    <p className="text-red-800 dark:text-red-200 text-sm mt-1">Can be confusing for new teams</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 dark:text-red-400 mt-1">🔢</span>
                  <div>
                    <strong className="text-red-900 dark:text-red-100">Abstract Numbers:</strong>
                    <p className="text-red-800 dark:text-red-200 text-sm mt-1">Don't mean much initially</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 dark:text-red-400 mt-1">⏱️</span>
                  <div>
                    <strong className="text-red-900 dark:text-red-100">Requires Calibration:</strong>
                    <p className="text-red-800 dark:text-red-200 text-sm mt-1">Needs time to establish meaning</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">T-Shirt Sizing (XS, S, M, L, XL, XXL)</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
                ✅ Pros
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 dark:text-green-400 mt-1">🧠</span>
                  <div>
                    <strong className="text-green-900 dark:text-green-100">Intuitive:</strong>
                    <p className="text-green-800 dark:text-green-200 text-sm mt-1">Everyone understands relative sizes</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 dark:text-green-400 mt-1">⚡</span>
                  <div>
                    <strong className="text-green-900 dark:text-green-100">Quick to Learn:</strong>
                    <p className="text-green-800 dark:text-green-200 text-sm mt-1">No mathematical concepts needed</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 dark:text-green-400 mt-1">😌</span>
                  <div>
                    <strong className="text-green-900 dark:text-green-100">Less Intimidating:</strong>
                    <p className="text-green-800 dark:text-green-200 text-sm mt-1">Feels less precise and formal</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
                ⚠️ Cons
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-red-600 dark:text-red-400 mt-1">📏</span>
                  <div>
                    <strong className="text-red-900 dark:text-red-100">Too Coarse:</strong>
                    <p className="text-red-800 dark:text-red-200 text-sm mt-1">Can be too coarse for detailed estimation</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 dark:text-red-400 mt-1">➕</span>
                  <div>
                    <strong className="text-red-900 dark:text-red-100">Size Inflation:</strong>
                    <p className="text-red-800 dark:text-red-200 text-sm mt-1">Teams may want to add sizes (M+, L-, etc.)</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 dark:text-red-400 mt-1">📊</span>
                  <div>
                    <strong className="text-red-900 dark:text-red-100">Velocity Tracking:</strong>
                    <p className="text-red-800 dark:text-red-200 text-sm mt-1">Harder to convert to velocity calculations</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Choosing the Right Scale</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">🔢 Use Fibonacci When:</h3>
              <ul className="space-y-3 text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  Your team is experienced with agile
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  You need detailed sprint planning
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  You track velocity metrics
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  Stories vary significantly in size
                </li>
              </ul>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-4">👕 Use T-Shirt Sizing When:</h3>
              <ul className="space-y-3 text-purple-800 dark:text-purple-200">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400">•</span>
                  New to agile estimation
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400">•</span>
                  Doing high-level roadmap planning
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400">•</span>
                  Team finds numbers intimidating
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400">•</span>
                  Estimating epics or features
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Making the Switch</h2>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-r-xl p-6">
            <p className="text-lg text-yellow-800 dark:text-yellow-200 mb-4">
              If you want to change estimation scales:
            </p>
            <ol className="space-y-3 text-yellow-800 dark:text-yellow-200">
              <li className="flex gap-3">
                <span className="font-bold">1.</span>
                <span>Discuss with the team first</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">2.</span>
                <span>Do a few practice sessions</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">3.</span>
                <span>Re-baseline your reference stories</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">4.</span>
                <span>Give it at least 3 sprints before judging</span>
              </li>
            </ol>
          </div>
        </section>
      </div>
    ),
    date: '2025-06-12',
    readTime: '7 min read',
    tags: ['Estimation Scales', 'Comparison', 'Methodology'],
  },
  'facilitating-sessions': {
    title: 'The Art of Facilitating Planning Poker Sessions',
    content: () => (
      <div className="space-y-8">
        <section>
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-8 font-medium">
            A good facilitator makes the difference between a productive estimation session and a frustrating waste of time. Your job is to guide the process, not influence the estimates.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Pre-Session Preparation</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-3">
                📚 Story Preparation
              </h3>
              <ul className="space-y-3 text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  Review stories beforehand for clarity
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  Identify stories that need splitting
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  Gather any necessary documentation
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  Prepare acceptance criteria
                </li>
              </ul>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-3">
                👥 Team Preparation
              </h3>
              <ul className="space-y-3 text-purple-800 dark:text-purple-200">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400">•</span>
                  Ensure all relevant team members attend
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400">•</span>
                  Share the agenda in advance
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400">•</span>
                  Set up the estimation tool
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400">•</span>
                  Book a quiet, comfortable space
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Running the Session</h2>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-3">
              🚀 Opening (10 minutes)
            </h3>
            <ul className="space-y-3 text-green-800 dark:text-green-200">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">•</span>
                Review the agenda and goals
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">•</span>
                Remind everyone of the estimation scale
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">•</span>
                Establish or review ground rules
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">•</span>
                Do a quick warm-up with a reference story
              </li>
            </ul>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-indigo-900 dark:text-indigo-100 mb-4 flex items-center gap-3">
              🎯 Story Estimation Process
            </h3>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">1</span>
                <div>
                  <strong className="text-indigo-900 dark:text-indigo-100">Present the Story:</strong>
                  <span className="text-indigo-800 dark:text-indigo-200 ml-2">Read title and description clearly</span>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">2</span>
                <div>
                  <strong className="text-indigo-900 dark:text-indigo-100">Clarify Requirements:</strong>
                  <span className="text-indigo-800 dark:text-indigo-200 ml-2">Allow questions and discussion</span>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">3</span>
                <div>
                  <strong className="text-indigo-900 dark:text-indigo-100">Estimate:</strong>
                  <span className="text-indigo-800 dark:text-indigo-200 ml-2">Everyone selects cards privately</span>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">4</span>
                <div>
                  <strong className="text-indigo-900 dark:text-indigo-100">Reveal:</strong>
                  <span className="text-indigo-800 dark:text-indigo-200 ml-2">Show all estimates simultaneously</span>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">5</span>
                <div>
                  <strong className="text-indigo-900 dark:text-indigo-100">Discuss:</strong>
                  <span className="text-indigo-800 dark:text-indigo-200 ml-2">Focus on highest and lowest estimates</span>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">6</span>
                <div>
                  <strong className="text-indigo-900 dark:text-indigo-100">Re-estimate:</strong>
                  <span className="text-indigo-800 dark:text-indigo-200 ml-2">Continue until consensus</span>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Facilitation Techniques</h2>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-orange-900 dark:text-orange-100 mb-4 flex items-center gap-3">
              💬 Managing Discussions
            </h3>
            <ul className="space-y-3 text-orange-800 dark:text-orange-200">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400">•</span>
                <div>
                  <strong>Focus on Outliers:</strong> Ask highest and lowest estimators to explain
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400">•</span>
                <div>
                  <strong>Timebox Discussions:</strong> Set 5-10 minute limits
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400">•</span>
                <div>
                  <strong>Capture Assumptions:</strong> Write down important decisions
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400">•</span>
                <div>
                  <strong>Stay Neutral:</strong> Don't advocate for specific estimates
                </div>
              </li>
            </ul>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-3 flex items-center gap-2">
                🗣️ Dominating Voices
              </h4>
              <ul className="space-y-2 text-red-800 dark:text-red-200">
                <li>• Use round-robin for questions</li>
                <li>• Ask quieter members directly</li>
                <li>• Set speaking time limits</li>
              </ul>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3 flex items-center gap-2">
                🔄 Analysis Paralysis
              </h4>
              <ul className="space-y-2 text-yellow-800 dark:text-yellow-200">
                <li>• Set discussion time limits</li>
                <li>• Suggest parking complex issues</li>
                <li>• Remind team of the goal</li>
              </ul>
            </div>

            <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-teal-900 dark:text-teal-100 mb-3 flex items-center gap-2">
                📊 Wide Estimate Ranges
              </h4>
              <ul className="space-y-2 text-teal-800 dark:text-teal-200">
                <li>• Explore different interpretations</li>
                <li>• Consider splitting the story</li>
                <li>• Look for hidden complexity</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Session Management</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100 mb-4 flex items-center gap-3">
                ⚡ Keeping Energy High
              </h3>
              <ul className="space-y-3 text-emerald-800 dark:text-emerald-200">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">•</span>
                  Take breaks every 45-60 minutes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">•</span>
                  Vary your facilitation style
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">•</span>
                  Use humor appropriately
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">•</span>
                  Celebrate consensus moments
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">•</span>
                  Keep sessions under 2 hours
                </li>
              </ul>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-3">
                ✅ Closing the Session
              </h3>
              <ul className="space-y-3 text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 dark:text-slate-400">•</span>
                  Review what was accomplished
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 dark:text-slate-400">•</span>
                  Document any parking lot items
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 dark:text-slate-400">•</span>
                  Schedule follow-up actions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 dark:text-slate-400">•</span>
                  Gather feedback on the process
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Continuous Improvement</h2>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <div className="text-center mb-6">
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                Great facilitators never stop learning and improving their skills.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">📝</span>
                  Ask for retrospective feedback
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400">📊</span>
                  Track estimation accuracy over time
                </li>
              </ul>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">🔄</span>
                  Adjust your facilitation style
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 dark:text-orange-400">🤝</span>
                  Share learnings with other facilitators
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    ),
    date: '2025-06-10',
    readTime: '9 min read',
    tags: ['Facilitation', 'Leadership', 'Team Management'],
  },
  'story-point-calibration': {
    title: 'Story Point Calibration: Building Team Consensus',
    content: () => (
      <div className="space-y-8">
        <section>
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-8 font-medium">
            Story point calibration ensures your team has a shared understanding of what each point value represents. Without proper calibration, estimates become meaningless and velocity tracking impossible.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Why Calibration Matters</h2>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-r-xl p-6 mb-6">
            <p className="text-lg text-yellow-800 dark:text-yellow-200 leading-relaxed">
              Without calibration, "3 points" means something completely different to each team member. 
              Calibration creates a shared language that makes estimation consistent and velocity predictable.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">The Calibration Process</h2>
          
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-3">
                📋 Step 1: Choose Reference Stories
              </h3>
              <p className="text-blue-800 dark:text-blue-200 mb-4">
                Select 3-5 stories your team has completed that represent different sizes:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-blue-800/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Small (1-2 points)</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Simple bug fixes</li>
                    <li>• Minor text changes</li>
                    <li>• Configuration updates</li>
                  </ul>
                </div>
                <div className="bg-white dark:bg-blue-800/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Medium (3-5 points)</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• New form fields</li>
                    <li>• Simple features</li>
                    <li>• Basic API endpoints</li>
                  </ul>
                </div>
                <div className="bg-white dark:bg-blue-800/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Large (8-13 points)</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Complex features</li>
                    <li>• Third-party integrations</li>
                    <li>• Database migrations</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-3">
                ⚓ Step 2: Establish Anchor Points
              </h3>
              <p className="text-purple-800 dark:text-purple-200">
                Start with your smallest reference story and assign it 1 or 2 points. Use this as your baseline for all other estimates. 
                This becomes your "anchor" that everything else is compared against.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-3">
                📏 Step 3: Relative Sizing
              </h3>
              <p className="text-green-800 dark:text-green-200 mb-3">
                For each new story, ask: "Is this bigger or smaller than our reference stories?"
              </p>
              <div className="bg-white dark:bg-green-800/30 p-4 rounded-lg">
                <p className="text-green-900 dark:text-green-100 font-semibold mb-2">Remember:</p>
                <p className="text-green-800 dark:text-green-200">Compare complexity, not time. A story might take longer due to external dependencies, but that doesn't make it more complex.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Calibration Techniques</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-orange-900 dark:text-orange-100 mb-4 flex items-center gap-3">
                🧱 The Wall Method
              </h3>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <span className="text-orange-800 dark:text-orange-200">Put reference stories on a wall in order of size</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <span className="text-orange-800 dark:text-orange-200">Place new stories relative to existing ones</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <span className="text-orange-800 dark:text-orange-200">Move stories up or down until everyone agrees</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <span className="text-orange-800 dark:text-orange-200">Assign point values based on position</span>
                </li>
              </ol>
            </div>

            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-teal-900 dark:text-teal-100 mb-4 flex items-center gap-3">
                🪣 Bucket Sorting
              </h3>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <span className="text-teal-800 dark:text-teal-200">Create buckets for each point value</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <span className="text-teal-800 dark:text-teal-200">Sort stories into appropriate buckets</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <span className="text-teal-800 dark:text-teal-200">Discuss any that seem out of place</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <span className="text-teal-800 dark:text-teal-200">Refine until the team agrees</span>
                </li>
              </ol>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Common Calibration Challenges</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-3 flex items-center gap-2">
                👥 Different Skill Levels
              </h3>
              <p className="text-red-800 dark:text-red-200 text-sm mb-3">
                Team members with different experience levels may estimate differently:
              </p>
              <ul className="space-y-2 text-red-800 dark:text-red-200 text-sm">
                <li>• Focus on team average, not individual capability</li>
                <li>• Consider pair programming for complex stories</li>
                <li>• Document assumptions about who will work on what</li>
              </ul>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-3 flex items-center gap-2">
                🔧 Technical Debt
              </h3>
              <p className="text-orange-800 dark:text-orange-200 text-sm mb-3">
                Legacy code and technical debt affect estimates:
              </p>
              <ul className="space-y-2 text-orange-800 dark:text-orange-200 text-sm">
                <li>• Include refactoring effort in estimates</li>
                <li>• Track technical debt separately if needed</li>
                <li>• Consider creating debt reduction stories</li>
              </ul>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                🔗 External Dependencies
              </h3>
              <p className="text-purple-800 dark:text-purple-200 text-sm mb-3">
                Dependencies can complicate estimation:
              </p>
              <ul className="space-y-2 text-purple-800 dark:text-purple-200 text-sm">
                <li>• Estimate only the work your team controls</li>
                <li>• Track dependencies separately</li>
                <li>• Consider probability of delays</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Maintaining Calibration</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-3">
                📊 Regular Reviews
              </h3>
              <ul className="space-y-3 text-green-800 dark:text-green-200">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">•</span>
                  Review estimates vs. actual effort monthly
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">•</span>
                  Identify patterns in over/under estimation
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">•</span>
                  Adjust reference stories if needed
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">•</span>
                  Update team understanding
                </li>
              </ul>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-indigo-900 dark:text-indigo-100 mb-4 flex items-center gap-3">
                👋 New Team Members
              </h3>
              <ul className="space-y-3 text-indigo-800 dark:text-indigo-200">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400">•</span>
                  Walk through reference stories
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400">•</span>
                  Explain team's estimation philosophy
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400">•</span>
                  Pair them with experienced estimators
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400">•</span>
                  Give them time to learn the codebase
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Signs You Need Re-Calibration</h2>
          
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-xl p-6">
            <ul className="space-y-3 text-red-800 dark:text-red-200">
              <li className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400">⚠️</span>
                Velocity becomes unpredictable
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400">⚠️</span>
                Estimates consistently wrong
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400">⚠️</span>
                Team members estimate very differently
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400">⚠️</span>
                Major technology or process changes
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Best Practices</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">✅ Do This</h3>
              <ul className="space-y-2 text-green-800 dark:text-green-200">
                <li>• Estimate complexity, not time</li>
                <li>• Include all work in your definition of done</li>
                <li>• Document your team's estimation standards</li>
                <li>• Be patient - calibration takes time</li>
                <li>• Review and adjust periodically</li>
              </ul>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">⚠️ Avoid This</h3>
              <ul className="space-y-2 text-yellow-800 dark:text-yellow-200">
                <li>• Don't change reference stories lightly</li>
                <li>• Don't compare teams' point values</li>
                <li>• Don't use points for performance metrics</li>
                <li>• Don't rush the calibration process</li>
                <li>• Don't estimate in hours then convert</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Tools for Calibration</h2>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">🗂️</span>
                  Story mapping boards
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400">📊</span>
                  Estimation history tracking
                </li>
              </ul>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400">📚</span>
                  Reference story libraries
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600 dark:text-pink-400">📋</span>
                  Team estimation guidelines
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    ),
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

  // Extract description from title and first few words
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
            {typeof post.content === 'function' ? (
              <post.content />
            ) : (
              <div 
                className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            )}
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
    </div>
  )
}
