import { login } from './actions'

export default async function LoginPage(props: { searchParams: Promise<{ message: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto pt-20">
      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2" style={{ color: 'var(--ft-text-primary)' }}>
        <h1 className="text-2xl font-bold mb-4 tracking-tight">FocusTag Admin Login</h1>
        
        <label className="text-sm font-semibold uppercase tracking-wider mb-1" htmlFor="email" style={{ color: 'var(--ft-text-muted)' }}>
          Email
        </label>
        <input
          className="ft-input rounded-md px-4 py-2 mb-6 transition-colors"
          name="email"
          placeholder="you@example.com"
          required
        />
        
        <label className="text-sm font-semibold uppercase tracking-wider mb-1" htmlFor="password" style={{ color: 'var(--ft-text-muted)' }}>
          Password
        </label>
        <input
          className="ft-input rounded-md px-4 py-2 mb-6 transition-colors"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        
        <button
          formAction={login}
          className="rounded-md px-4 py-2.5 mb-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 hover:bg-[var(--ft-accent-hover)]"
          style={{ backgroundColor: 'var(--ft-accent)' }}
        >
          Sign In
        </button>
        
        {searchParams?.message && (
          <div className="ft-error mt-4 p-4 border rounded-md flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            {searchParams.message}
          </div>
        )}
      </form>
    </div>
  )
}
