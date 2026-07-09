import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { API_URL } from '../lib/api'
import heroImage from '../assets/hero.jpg'
import wealLogo from '../assets/weal-logo.jpeg'

/* ── tiny fade-in-on-scroll hook ───────────────────────────── */
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('reveal-visible'); io.unobserve(el) } },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

function Section({ id, children, className = '' }) {
  const ref = useReveal()
  return <section id={id} ref={ref} className={`reveal-section ${className}`}>{children}</section>
}

/* ── animated counter ──────────────────────────────────────── */
function Counter({ end, suffix = '' }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0
        const step = Math.max(1, Math.floor(end / 40))
        const t = setInterval(() => {
          start += step
          if (start >= end) { setVal(end); clearInterval(t) }
          else setVal(start)
        }, 30)
        io.unobserve(el)
      }
    }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [end])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

export default function HomePage() {
  const { darkMode, isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])

  useEffect(() => {
    fetch(`${API_URL}/posts`)
      .then(res => res.json())
      .then(data => setPosts(data.posts || []))
      .catch(() => {})
  }, [])

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a1a] text-slate-900 dark:text-slate-100">

        {/* ── inject reveal + glow styles ─────────────────────────── */}
        <style>{`
          .reveal-section { opacity:0; transform:translateY(32px); transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); }
          .reveal-visible { opacity:1; transform:translateY(0); }

          @keyframes blob { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-40px) scale(1.1)} 66%{transform:translate(-20px,20px) scale(.9)} }
          .blob { animation: blob 7s ease-in-out infinite; }
          .blob-delay { animation-delay: 2s; }
          .blob-delay2 { animation-delay: 4s; }

          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
          .float { animation: float 6s ease-in-out infinite; }

          @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
          .shimmer-text { background-size:200% auto; animation: shimmer 3s linear infinite; }

          .glass { backdrop-filter:blur(16px) saturate(180%); -webkit-backdrop-filter:blur(16px) saturate(180%); }
        `}</style>

        {/* ── Navbar ──────────────────────────────────────────────── */}
        <Navbar
          wrapperClass="bg-white/60 dark:bg-[#0a0a1a]/60 glass border-b border-white/10"
          innerClass="py-2 gap-6"
          navLinks={
            <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
              {['Home', 'About', 'Stories', 'Resources'].map(l => (
                <button 
                  key={l} 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(l.toLowerCase())?.scrollIntoView({ behavior: 'smooth' });
                  }} 
                  className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-violet-500 hover:after:w-full after:transition-all"
                >
                  {l}
                </button>
              ))}
              <button
                onClick={() => navigate('/events')}
                className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-violet-500 hover:after:w-full after:transition-all font-bold text-violet-600 dark:text-violet-400"
              >
                Events
              </button>
            </nav>
          }
        >
          {!isAuthenticated && (
            <button onClick={() => navigate('/auth')} className="text-sm font-semibold px-5 py-2 rounded-full border border-violet-400/40 text-violet-600 dark:text-violet-300 hover:bg-violet-500 hover:text-white hover:border-violet-500 transition-all duration-300">Login / Join</button>
          )}
          {isAuthenticated && (
            <button onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')} className="text-sm font-semibold px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 transition-all duration-300">
              {isAdmin ? 'Admin Panel' : 'Dashboard'}
            </button>
          )}
        </Navbar>

        {/* ══════════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════════ */}
        <section id="home" className="relative pt-8 md:pt-12 pb-20 md:pb-28 overflow-hidden">
          {/* blobs */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="blob absolute top-20 left-10 w-72 h-72 bg-violet-500/20 dark:bg-violet-600/15 rounded-full blur-3xl" />
            <div className="blob blob-delay absolute bottom-20 right-20 w-96 h-96 bg-fuchsia-500/20 dark:bg-fuchsia-600/10 rounded-full blur-3xl" />
            <div className="blob blob-delay2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-400/10 dark:bg-cyan-500/10 rounded-full blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-6 lg:px-8 grid md:grid-cols-2 gap-16 items-center w-full">
            {/* text */}
            <div className="space-y-8 max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 dark:bg-violet-500/20 border border-violet-300/30 dark:border-violet-500/30">
                <span className="text-xs font-semibold text-violet-600 dark:text-violet-300 tracking-wide uppercase">Open & supportive community</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-[5rem] font-black leading-[1.1] tracking-tighter">
                Your Safe Space for{' '}
                <span className="shimmer-text bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">Mental Wellness</span>
              </h1>

              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Share your story, support others, and build real connections — all in a judgment-free environment designed for healing and growth.
              </p>

              <div className="flex flex-wrap gap-5">
                <button onClick={() => navigate('/auth')} className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-bold shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 transition-all duration-300 text-sm">
                  Get Started — It's Free
                  <span className="ml-2 inline-block group-hover:translate-x-1 transition-transform">→</span>
                </button>
                <a href="#how-it-works" className="px-8 py-4 rounded-full font-bold border-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-300 text-sm flex items-center justify-center">
                  How It Works
                </a>
              </div>

              {/* mini stats */}
              <div className="flex flex-wrap gap-10 pt-8 border-t border-slate-200 dark:border-slate-800/60 mt-8">
                {[
                  { n: 500, s: '+', l: 'Community Members' },
                  { n: 1200, s: '+', l: 'Stories Shared' },
                  { n: 98, s: '%', l: 'Feel Supported' },
                ].map(({ n, s, l }) => (
                  <div key={l}>
                    <div className="text-3xl font-black text-violet-600 dark:text-violet-400 tracking-tight"><Counter end={n} suffix={s} /></div>
                    <div className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-wider">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* hero image */}
            <div className="relative float">
              <div className="absolute -inset-4 bg-gradient-to-tr from-violet-500/20 via-fuchsia-500/20 to-cyan-400/20 rounded-3xl blur-2xl -z-10" />
              <div className="rounded-[2rem] overflow-hidden border border-white/20 dark:border-slate-700/50 shadow-2xl shadow-violet-500/10">
                <img src={heroImage} alt="WEAL Community" className="w-full h-[420px] lg:h-[520px] object-cover" />
              </div>
              {/* floating badge */}
              <div className="absolute -bottom-4 -left-4 glass bg-white/80 dark:bg-slate-800/80 rounded-2xl px-5 py-3 shadow-xl border border-white/30 dark:border-slate-600/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-lg">🛡️</div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">100% Safe & Anonymous</div>
                    <div className="text-[10px] text-slate-500">Your privacy, always protected</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-6 lg:px-8 space-y-32 pb-32 pt-10">

          {/* ══ Latest Stories ══════════════════════════════════════ */}
          <Section id="stories" className="space-y-10">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-2">From the Community</p>
                <h2 className="text-3xl md:text-4xl font-black">Latest Stories</h2>
              </div>
              <button onClick={() => navigate('/auth')} className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline underline-offset-4 hidden md:block">View all →</button>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {posts.slice(0, 3).length > 0 ? posts.slice(0, 3).map((post, i) => (
                <article key={post.id} className="group relative bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col">
                  {/* accent bar */}
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${i === 0 ? 'from-violet-500 to-fuchsia-500' : i === 1 ? 'from-fuchsia-500 to-pink-500' : 'from-cyan-500 to-blue-500'}`} />
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br ${i === 0 ? 'from-violet-500 to-fuchsia-500' : i === 1 ? 'from-fuchsia-500 to-pink-500' : 'from-cyan-500 to-blue-500'}`}>
                      {(post.author?.name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{post.author?.name || 'Anonymous'}</p>
                      <p className="text-[10px] text-slate-400">{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-2 line-clamp-1">{post.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{post.content}</p>
                  <button onClick={() => navigate('/auth')} className="mt-5 text-sm font-bold text-violet-600 dark:text-violet-400 group-hover:underline underline-offset-4">Read more →</button>
                </article>
              )) : (
                <div className="md:col-span-3 py-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-4xl mb-3">📝</p>
                  <p className="text-slate-400 font-medium">No stories yet. Be the first to share!</p>
                </div>
              )}
            </div>
          </Section>

          {/* ══ How It Works ════════════════════════════════════════ */}
          <Section id="how-it-works" className="space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-500 mb-2">Simple & Safe</p>
              <h2 className="text-3xl md:text-4xl font-black">How It Works</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-3">Three simple steps to start your wellness journey</p>
            </div>
            <div className="grid md:grid-cols-3 gap-10">
              {[
                { icon: '✍️', step: '01', title: 'Sign Up', desc: 'Create a free account in seconds. No personal details required beyond your email.', gradient: 'from-violet-500 to-purple-600' },
                { icon: '💬', step: '02', title: 'Share Your Story', desc: 'Post anonymously or with your name. Write about your journey, struggles, or wins.', gradient: 'from-fuchsia-500 to-pink-600' },
                { icon: '🤝', step: '03', title: 'Connect & Heal', desc: "Read others' stories, leave supportive comments, and build real community connections.", gradient: 'from-cyan-500 to-blue-600' },
              ].map(({ icon, step, title, desc, gradient }) => (
                <div key={step} className="group relative bg-white dark:bg-slate-900/60 rounded-3xl p-10 border border-slate-200/80 dark:border-slate-800 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center">
                  <div className={`mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>{icon}</div>
                  <p className="text-[11px] font-black text-violet-500 dark:text-violet-400 tracking-[0.2em] mb-2 uppercase">STEP {step}</p>
                  <h3 className="text-2xl font-extrabold mb-3">{title}</h3>
                  <p className="text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ══ Features Grid ══════════════════════════════════════ */}
          <Section id="about" className="space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-500 mb-2">Why WEAL?</p>
              <h2 className="text-3xl md:text-4xl font-black">Built for Your Wellbeing</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: '🔒', title: 'Anonymous Posting', desc: 'Share without revealing your identity. Complete privacy.', color: 'violet' },
                { icon: '💚', title: 'Supportive Community', desc: 'Kind, judgment-free interactions only. We moderate strictly.', color: 'emerald' },
                { icon: '📊', title: 'Mood Tracking', desc: 'Daily check-ins to understand your emotional patterns.', color: 'fuchsia' },
                { icon: '🛡️', title: 'Safe Space', desc: 'Strict moderation and community guidelines keep you safe.', color: 'cyan' },
              ].map(({ icon, title, desc, color }) => (
                <div key={title} className="bg-white dark:bg-slate-900/60 rounded-[2rem] p-8 border border-slate-200/80 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
                  <div className={`w-14 h-14 rounded-2xl bg-${color}-100 dark:bg-${color}-900/40 flex items-center justify-center text-3xl mb-5 shadow-sm`}>{icon}</div>
                  <h3 className="font-bold text-lg mb-3">{title}</h3>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ══ Testimonials ═══════════════════════════════════════ */}
          <Section className="space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-widest text-pink-500 mb-2">Community Voices</p>
              <h2 className="text-3xl md:text-4xl font-black">What People Are Saying</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { quote: 'This platform gave me the courage to talk about my anxiety for the first time. The community here is incredibly kind.', name: 'Anonymous Member', gradient: 'from-violet-500 to-purple-600' },
                { quote: "I found people who truly understand what I'm going through. WEAL has been a lifeline during my hardest days.", name: 'Anonymous Member', gradient: 'from-fuchsia-500 to-pink-600' },
                { quote: 'Being able to share anonymously made all the difference. I finally feel heard without fear of judgment.', name: 'Anonymous Member', gradient: 'from-cyan-500 to-blue-600' },
              ].map(({ quote, name, gradient }, i) => (
                <div key={i} className="relative flex flex-col bg-white dark:bg-slate-900/60 rounded-[2rem] p-10 border border-slate-200/80 dark:border-slate-800 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-[0.03] dark:opacity-10 rounded-bl-[80px]`} />
                  <div className="text-6xl font-serif text-violet-200 dark:text-violet-800/40 leading-none mb-4">"</div>
                  <p className="flex-1 text-base text-slate-700 dark:text-slate-300 font-medium italic leading-relaxed mb-8">{quote}</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold`}>A</div>
                    <div>
                      <p className="text-xs font-bold">{name}</p>
                      <p className="text-[10px] text-slate-400">WEAL Community</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ══ CTA Banner ═════════════════════════════════════════ */}
          <Section>
            <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 p-14 md:p-20 text-center text-white shadow-2xl">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
              <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight">Ready to Start Your Journey?</h2>
                <p className="text-white/90 text-lg md:text-xl font-medium">Join thousands who have already found support, connection, and healing in our community.</p>
                <button onClick={() => navigate('/auth')} className="px-12 py-4 rounded-full bg-white text-violet-700 font-black shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-sm tracking-wide">
                  Join WEAL for Free →
                </button>
              </div>
            </div>
          </Section>

          {/* ══ Resources ══════════════════════════════════════════ */}
          <Section id="resources" className="space-y-10">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-2">Support & Help</p>
              <h2 className="text-3xl md:text-4xl font-black">Resources</h2>
            </div>
            <div className="grid md:grid-cols-1 max-w-2xl mx-auto gap-6">
              <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-8 border border-slate-200/80 dark:border-slate-800 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-2xl mb-4">📋</div>
                <h3 className="font-bold text-lg mb-2">Community Guidelines</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-5">Respect rules, keep conversations kind, and support each other. Our guidelines ensure everyone feels welcome.</p>
                <button className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4">Learn More →</button>
              </div>

            </div>
          </Section>
        </main>

        {/* ══ Footer ═══════════════════════════════════════════════ */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0a0a1a]/80 glass">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
            <div className="grid md:grid-cols-4 gap-8 mb-10">
              <div className="space-y-3">
                <div className="font-extrabold text-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">WEAL</div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">A safe, anonymous space for mental wellness. Share, support, heal together.</p>
              </div>
              {[
                { title: 'Platform', links: ['Home', 'Stories', 'Resources', 'Guidelines'] },
                { title: 'Support', links: ['Help Center', 'Crisis Lines', 'Contact Us', 'FAQ'] },
                { title: 'Legal', links: ['Privacy Policy', 'Terms of Use', 'Cookie Policy', 'Accessibility'] },
              ].map(({ title, links }) => (
                <div key={title}>
                  <h4 className="font-bold text-sm mb-3">{title}</h4>
                  <ul className="space-y-2">
                    {links.map(l => (
                      <li key={l}><a href="#" className="text-sm text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">{l}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-400">© 2026 WEAL — Wellness & Emotional Awareness Layer. All rights reserved.</p>
              <div className="flex items-center gap-2">
                <img src={wealLogo} alt="Team Weal" className="h-8 w-8 object-cover rounded-full shadow-sm" />
                <span className="text-xs text-slate-500 font-bold tracking-wide">Team Weal</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
