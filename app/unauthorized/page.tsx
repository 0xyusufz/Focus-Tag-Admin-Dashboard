import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function UnauthorizedPage() {
  const logout = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center" style={{ backgroundColor: 'var(--ft-bg)' }}>
      <div className="rounded-xl border p-12 max-w-lg w-full" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-error-border)' }}>
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center border-4" style={{ backgroundColor: 'var(--ft-error-bg)', borderColor: 'var(--ft-error-border)', color: 'var(--ft-error-text)' }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-4 tracking-tight" style={{ color: 'var(--ft-text-primary)' }}>Access Denied</h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--ft-text-secondary)' }}>
          You do not have administrative access to this dashboard. Please contact your system administrator if you believe this is an error.
        </p>
        <form action={logout}>
          <button 
            className="w-full rounded-md px-6 py-2.5 text-sm font-medium border transition-colors focus:outline-none focus:ring-2 hover:bg-[var(--ft-bg-surface)] hover:text-[var(--ft-text-primary)]"
            style={{ backgroundColor: 'transparent', borderColor: 'var(--ft-border)', color: 'var(--ft-text-primary)' }}
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}
