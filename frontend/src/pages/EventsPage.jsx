import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

export default function EventsPage() {
  const { isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('events')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a1a] text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar
        wrapperClass="bg-white/60 dark:bg-[#0a0a1a]/60 glass border-b border-white/10 relative z-50"
        innerClass="py-2 gap-6"
      >
        <button 
          onClick={() => navigate('/')} 
          className="text-sm font-semibold px-5 py-2 rounded-full border border-violet-400/40 text-violet-600 dark:text-violet-300 hover:bg-violet-500 hover:text-white hover:border-violet-500 transition-all duration-300"
        >
          Home
        </button>
        {isAuthenticated && (
          <button 
            onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')} 
            className="text-sm font-semibold px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 transition-all duration-300"
          >
            {isAdmin ? 'Admin Panel' : 'Dashboard'}
          </button>
        )}
      </Navbar>

      <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-5xl px-6 py-4 flex gap-4">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-6 py-2 rounded-full font-bold text-sm transition-colors ${
              activeTab === 'events' 
                ? 'bg-violet-600 text-white shadow-md' 
                : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/50'
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`px-6 py-2 rounded-full font-bold text-sm transition-colors ${
              activeTab === 'register' 
                ? 'bg-fuchsia-600 text-white shadow-md' 
                : 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-200 dark:hover:bg-fuchsia-800/50'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-6 py-2 rounded-full font-bold text-sm transition-colors ${
              activeTab === 'team' 
                ? 'bg-cyan-600 text-white shadow-md' 
                : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-800/50'
            }`}
          >
            Team
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-6 py-2 rounded-full font-bold text-sm transition-colors ${
              activeTab === 'about' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/50'
            }`}
          >
            About Weal
          </button>
        </div>
      </div>

      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-12">
        
        {activeTab === 'events' && (
          <section id="previous-events" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
              Previous Events
            </h2>
            {/* Empty content as requested */}
          </section>
        )}

        {activeTab === 'register' && (
          <section id="register-events" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
              Registration for Upcoming Events
            </h2>
            {/* Empty content as requested */}
          </section>
        )}

        {activeTab === 'team' && (
          <section id="team-section" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
              Meet the Team
            </h2>
            {/* Empty content as requested */}
          </section>
        )}

        {activeTab === 'about' && (
          <section id="about-weal-section" className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-black mb-8 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent pb-2">
              WEAL
            </h2>
            <div className="bg-white dark:bg-slate-900/80 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
              <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                WEAL Club is a prominent health-tech and wellness student organization at PES University. 
                Founded in November 2021, the club aims to empower students to build innovative solutions for global medical challenges. 
                They frequently host major health-focused hackathons, ideathons, and awareness weeks.
              </p>
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
