// Server component: crawlable explainer copy for the landing page.
// HOME_FAQS also feeds the FAQPage structured data in app/page.tsx, so the markup always matches the visible text.

export const HOME_FAQS = [
  {
    question: 'Is Sprintro planning poker really free?',
    answer:
      'Yes. Sprintro is a free planning poker tool with no signup, no account and no limit on estimation rounds. Create a room and share the link with your team.',
  },
  {
    question: 'Do my teammates need an account to join?',
    answer:
      'No. Anyone with the six-character room code can join from a browser on desktop or mobile. Rooms can optionally be protected with a password.',
  },
  {
    question: 'Which estimation scales are supported?',
    answer:
      'You can estimate with the Fibonacci sequence (0 to 34), modified Fibonacci (0, ½, 1, 2, 3, 5, 8, 13, 20), powers of two (0 to 64) or T-shirt sizes (XS to XXL). Every scale also has "?" and coffee-break cards.',
  },
  {
    question: 'Can votes be anonymous?',
    answer:
      'Yes. Turn on anonymous voting so cards are revealed without names, which removes anchoring and seniority bias from the discussion.',
  },
  {
    question: 'Is planning poker the same as scrum poker?',
    answer:
      'Yes. Planning poker, scrum poker and pointing poker are different names for the same consensus-based agile estimation technique.',
  },
] as const;

const STEPS = [
  {
    title: 'Create a room',
    body: 'Start a planning poker session in one click, pick a template or estimation scale, and share the room code with your team.',
  },
  {
    title: 'Everyone votes privately',
    body: 'Each person picks a card for the user story at the same time, so nobody is anchored by the first number said out loud.',
  },
  {
    title: 'Reveal and discuss',
    body: 'Cards flip together. The highest and lowest estimates explain their reasoning, then the team re-votes until it reaches consensus.',
  },
];

export default function HomeContent() {
  return (
    <>
      {/* What is planning poker */}
      <section aria-labelledby="what-is-planning-poker" className="py-24 bg-white dark:bg-[#181818]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 id="what-is-planning-poker" className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            What Is Planning Poker?
          </h2>
          <div className="space-y-4 text-lg text-slate-600 dark:text-[#aaaaaa] leading-relaxed">
            <p>
              Planning poker (also called scrum poker) is a consensus-based agile estimation technique. Each member of
              a scrum team privately picks a card that represents the effort for a user story, usually in story points
              on a Fibonacci scale, and everyone reveals their card at the same time.
            </p>
            <p>
              Because votes are hidden until the reveal, quieter team members aren&apos;t swayed by the loudest voice
              or the most senior engineer. Big differences between estimates surface hidden assumptions early, before
              they turn into surprises mid-sprint.
            </p>
            <p>
              Sprintro brings planning poker online for remote and hybrid teams: real-time voting, anonymous mode,
              vote distribution statistics and a backlog to work through during sprint planning or backlog refinement.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-it-works" className="py-24 bg-slate-50 dark:bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 id="how-it-works" className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-16 text-center">
            How Online Planning Poker Works
          </h2>
          <ol className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="bg-white dark:bg-[#212121] p-8 rounded-2xl border border-slate-200 dark:border-[#303030] shadow-sm"
              >
                <span className="w-10 h-10 mb-4 bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] rounded-xl flex items-center justify-center text-white font-bold">
                  {index + 1}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-slate-600 dark:text-[#aaaaaa] leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="home-faq" className="py-24 bg-white dark:bg-[#181818]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 id="home-faq" className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-12 text-center">
            Planning Poker FAQ
          </h2>
          <div className="space-y-4">
            {HOME_FAQS.map((faq) => (
              <details
                key={faq.question}
                className="group bg-slate-50 dark:bg-[#212121] rounded-2xl border border-slate-200 dark:border-[#303030] p-6"
              >
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{faq.question}</h3>
                  <svg className="w-5 h-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-4 text-slate-600 dark:text-[#aaaaaa] leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
