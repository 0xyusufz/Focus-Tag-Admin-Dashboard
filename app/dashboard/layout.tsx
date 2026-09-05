import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { logout } from './actions'
import { HeaderProfile } from './HeaderProfile'
import { ThemeToggle } from './ThemeToggle'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch the user's canonical profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, role, institution_id')
    .eq('id', user.id)
    .single()

  // 3. Backend-authoritative admin authorization
  if (!profile || profile.role !== 'admin' || !profile.institution_id) {
    redirect('/unauthorized')
  }

  // 4. Fetch the institution context
  const { data: institution } = await supabase
    .from('institutions')
    .select('name')
    .eq('id', profile.institution_id)
    .single()

  // Gracefully expand short acronyms for display
  const displayName =
    institution?.name === 'GIET'
      ? 'Gandhi Institute of Engineering and Technology'
      : institution?.name || 'Unknown Institution'

  return (
    <div
      className="flex h-screen"
      style={{ backgroundColor: 'var(--ft-bg)', color: 'var(--ft-text-primary)' }}
    >
      {/* ── Sidebar ── */}
      <aside
        className="w-64 flex flex-col shrink-0 border-r"
        style={{
          backgroundColor: 'var(--ft-bg)',
          borderColor: 'var(--ft-border)',
        }}
      >
        {/* Brand */}
        <div
          className="h-16 px-6 flex items-center gap-3 border-b shrink-0"
          style={{ borderColor: 'var(--ft-border)' }}
        >
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold tracking-tighter shrink-0"
            style={{
              backgroundColor: 'var(--ft-accent-muted)',
              border: '1px solid var(--ft-accent-border)',
              color: 'var(--ft-accent)',
            }}
          >
            FT
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <h2
              className="text-[15px] font-semibold tracking-tight leading-tight"
              style={{ color: 'var(--ft-text-primary)' }}
            >
              FocusTag
            </h2>
            <p className="text-[11px] font-medium" style={{ color: 'var(--ft-text-muted)' }}>
              Admin Dashboard
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <NavLink href="/dashboard" icon={
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          }>Dashboard</NavLink>

          <div className="h-3" />

          <NavLink href="/dashboard/students" icon={
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          }>Students</NavLink>

          <NavLink href="/dashboard/teachers" icon={
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          }>Teachers</NavLink>

          <NavLink href="/dashboard/classes" icon={
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          }>Classes</NavLink>

          <NavLink href="/dashboard/locations" icon={
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          }>Locations</NavLink>

          <NavLink href="/dashboard/nfc-tags" icon={
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
          }>NFC Tags</NavLink>
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t shrink-0" style={{ borderColor: 'var(--ft-border)' }}>
          <form action={logout}>
            <button
              className="w-full px-4 py-2 rounded-md text-sm font-medium border transition-colors hover:bg-[var(--ft-bg-surface)] hover:text-[var(--ft-text-primary)]"
              style={{
                backgroundColor: 'transparent',
                borderColor: 'var(--ft-border)',
                color: 'var(--ft-text-secondary)',
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ backgroundColor: 'var(--ft-bg)' }}>
        {/* Header */}
        <header
          className="h-16 flex items-center justify-between px-8 shrink-0 border-b"
          style={{
            backgroundColor: 'var(--ft-bg)',
            borderColor: 'var(--ft-border)',
          }}
        >
          {/* Institution name */}
          <div className="flex items-center gap-3 min-w-0 pr-6">
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: 'var(--ft-accent)' }}
            />
            <span
              className="text-sm font-medium truncate"
              style={{ color: 'var(--ft-text-secondary)' }}
              title={displayName}
            >
              {displayName}
            </span>
          </div>

          {/* Right: theme toggle + profile */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <HeaderProfile
              name={profile.name || user.email || 'Admin'}
              role="Admin"
              institutionName={displayName}
              logoutAction={logout}
            />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

// Shared nav link component
function NavLink({
  href,
  icon,
  children,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-[var(--ft-bg-surface)] hover:text-[var(--ft-text-primary)]"
      style={{ color: 'var(--ft-text-secondary)' }}
    >
      <span style={{ color: 'var(--ft-text-muted)' }}>{icon}</span>
      {children}
    </Link>
  )
}
