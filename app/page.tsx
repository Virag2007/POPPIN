

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Landmark */}
      <header role="banner" className="border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-tight text-indigo-700" aria-label="POPPIN Platform">
              POPPIN
            </span>
            <span
              role="status"
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"
            >
              System Online
            </span>
          </div>
          <nav aria-label="Main Navigation">
            <a
              href="/api/v1/usernames/availability?username=demo"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 rounded-md transition-colors"
            >
              API Status
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content Landmark */}
      <main id="main-content" role="main" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Identity & User Management Platform
          </h1>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            The core authentication, user profile, three-step onboarding, relationship, and safety foundation powering POPPIN.
          </p>
        </div>

        {/* Feature Cards with Semantic Headings & WCAG compliant contrast */}
        <section aria-labelledby="features-heading" className="mt-12">
          <h2 id="features-heading" className="sr-only">
            Core Service Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Authentication & Safety</h3>
              <p className="mt-2 text-sm text-slate-600 leading-normal">
                Bcrypt password hashing, Google OAuth with state validation, JWT sessions with automatic revocation on password change, rate-limiting, and user blocking.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Profiles & Onboarding</h3>
              <p className="mt-2 text-sm text-slate-600 leading-normal">
                Unique @username availability checks, avatar/cover images with XSS-safe URL validation, skills, education, and guided three-step onboarding.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Connections & Feeds</h3>
              <p className="mt-2 text-sm text-slate-600 leading-normal">
                Follow/unfollow relations, follower lists with indexed database queries, suggested people, and notification event emission contracts for Developer 2.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Action Link with Accessible Touch Target & Focus State */}
        <div className="mt-12 text-center">
          <a
            href="/api/v1/usernames/availability?username=welcome_user"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-700 hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 shadow-sm transition-colors"
          >
            Inspect Live API Probe
          </a>
        </div>
      </main>

      {/* Footer Landmark */}
      <footer role="contentinfo" className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
          POPPIN Social Platform &copy; 2026. Built with Next.js App Router, TypeScript & Tailwind CSS.
        </div>
      </footer>
    </div>
  );
}
