export default function Footer({ text = '© 2026 WEAL | Safe space for mental health support' }) {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 py-4">
      <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-500">
        {text}
      </div>
    </footer>
  )
}
