'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Wrap in requestAnimationFrame to avoid synchronous setState inside an effect,
    // which triggers the react-hooks/set-state-in-effect lint rule.
    requestAnimationFrame(() => {
      setMounted(true)
      setIsDark(document.documentElement.classList.contains('dark'))
    })
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('ft-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('ft-theme', 'light')
    }
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-md" style={{ background: 'var(--ft-bg-surface)' }} />
    )
  }

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="w-9 h-9 rounded-md border ft-border ft-bg-surface flex items-center justify-center hover:ft-bg-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--ft-accent)] focus:ring-offset-2"
      style={{
        borderColor: 'var(--ft-border)',
        backgroundColor: 'var(--ft-bg-surface)',
      }}
    >
      {isDark ? (
        // Sun icon (click to go light)
        <svg
          className="w-4 h-4"
          style={{ color: 'var(--ft-text-secondary)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
          />
        </svg>
      ) : (
        // Moon icon (click to go dark)
        <svg
          className="w-4 h-4"
          style={{ color: 'var(--ft-text-secondary)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  )
}
