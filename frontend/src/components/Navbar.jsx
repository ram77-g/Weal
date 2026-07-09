import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/weal-logo.jpeg'

/**
 * Shared navbar component. Each page customizes via props:
 * - title: text next to logo
 * - titleClass: Tailwind classes for title text
 * - logoSize: logo dimensions (default h-12 w-12)
 * - wrapperClass: override outer div styling (default bg-white/80)
 * - innerClass: override inner padding (default py-4)
 * - navLinks: optional middle nav links (used by HomePage)
 * - children: right-side buttons/elements
 */
export default function Navbar({
  title = 'WEAL',
  titleClass = 'text-[28px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent',
  logoSize = 'h-12 w-12',
  wrapperClass = '',
  innerClass = 'py-4',
  navLinks,
  children
}) {
  const { darkMode, setDarkMode } = useAuth()
  const navigate = useNavigate()

  return (
    <div className={`border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 ${wrapperClass || 'bg-white/80 dark:bg-slate-900/80'}`}>
      <div className={`mx-auto max-w-7xl px-4 flex items-center justify-between ${innerClass}`}>
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity active:scale-95"
        >
          <img src={logo} alt="WEAL logo" className={`${logoSize} rounded-full object-cover shadow-sm`} />
          <div className={`font-black tracking-tight ${titleClass}`}>{title}</div>
        </button>
        {navLinks}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          {children}
        </div>
      </div>
    </div>
  )
}
