'use client'

import { useState } from 'react'

export function HeaderProfile({
  name,
  role,
  institutionName,
  logoutAction,
}: {
  name: string
  role: string
  institutionName: string
  logoutAction: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 rounded-full px-2 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          color: 'var(--ft-text-secondary)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ft-bg-surface)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium leading-tight" style={{ color: 'var(--ft-text-primary)' }}>
            {name}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ft-accent)' }}>
            {role}
          </span>
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
          style={{
            backgroundColor: 'var(--ft-accent-muted)',
            border: '1px solid var(--ft-accent-border)',
            color: 'var(--ft-accent)',
          }}
        >
          {name ? name.charAt(0).toUpperCase() : 'A'}
        </div>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-80 z-50 flex flex-col border-l transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          backgroundColor: 'var(--ft-bg-elevated)',
          borderColor: 'var(--ft-border)',
        }}
      >
        {/* Drawer header */}
        <div
          className="p-6 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--ft-border)' }}
        >
          <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--ft-text-primary)' }}>
            Admin Profile
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
            style={{ color: 'var(--ft-text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ft-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ft-text-muted)')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {[
            { label: 'Name', value: name },
            { label: 'Role', value: role },
            { label: 'Institution', value: institutionName },
          ].map(({ label, value }) => (
            <div key={label}>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--ft-text-muted)' }}
              >
                {label}
              </p>
              <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--ft-text-primary)' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Drawer footer */}
        <div className="p-6 border-t shrink-0" style={{ borderColor: 'var(--ft-border)' }}>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full px-4 py-2.5 rounded-md text-sm font-medium border transition-colors focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'transparent',
                borderColor: 'var(--ft-border)',
                color: 'var(--ft-text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--ft-bg-surface)'
                e.currentTarget.style.color = 'var(--ft-text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'var(--ft-text-secondary)'
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
