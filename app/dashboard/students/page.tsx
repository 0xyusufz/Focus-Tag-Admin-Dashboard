import { createClient } from '@/utils/supabase/server'

export default async function StudentsPage() {
  const supabase = await createClient()

  const { data: students, error: studentsError } = await supabase
    .from('profiles')
    .select('id, name, role')
    .eq('role', 'student')
    .order('name', { ascending: true })

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--ft-text-primary)' }}>
          Students
        </h1>
        <p style={{ color: 'var(--ft-text-secondary)' }}>Manage student profiles in your institution.</p>
      </div>

      {/* Institution Students */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--ft-text-primary)' }}>
          Institution Students
        </h2>
        {studentsError && <FtAlert variant="error" message={`Error loading students: ${studentsError.message}`} />}
        {!studentsError && (!students || students.length === 0) && (
          <FtEmpty message="No students are currently assigned to this institution." />
        )}
        {students && students.length > 0 && (
          <FtTable>
            <FtThead cols={['Name', 'ID']} />
            <tbody>
              {students.map((s, i) => (
                <tr
                  key={s.id}
                  className="ft-table-row-hover transition-colors"
                  style={{ borderTop: i > 0 ? '1px solid var(--ft-table-divider)' : undefined }}
                >
                  <td className="px-6 py-4 font-medium" style={{ color: 'var(--ft-text-primary)' }}>{s.name || '—'}</td>
                  <td className="px-6 py-4 font-mono text-xs" style={{ color: 'var(--ft-text-muted)' }}>{s.id}</td>
                </tr>
              ))}
            </tbody>
          </FtTable>
        )}
      </section>

      {/* Onboard Student */}
      <section>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--ft-text-primary)' }}>
          Onboard Student
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--ft-text-secondary)' }}>
          Search for an existing FocusTag account that is not yet assigned to any institution.
          Only accounts with role <strong style={{ color: 'var(--ft-text-primary)', fontWeight: 600 }}>student</strong> and no institution are shown.
        </p>
        <OnboardSearch />
      </section>
    </div>
  )
}

function OnboardSearch() {
  async function handleSearch(formData: FormData) {
    'use server'
    const { redirect } = await import('next/navigation')
    const term = String(formData.get('searchTerm') || '').trim()
    if (term.length >= 3) {
      redirect(`/dashboard/students/search?q=${encodeURIComponent(term)}`)
    }
  }

  return (
    <div className="rounded-xl border p-6 md:p-8" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)' }}>
      <form action={handleSearch}>
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            name="searchTerm"
            type="text"
            placeholder="Search by email prefix (min. 3 chars)"
            minLength={3}
            maxLength={254}
            required
            className="ft-input flex-1 rounded-md border px-4 py-2.5 text-sm transition-all"
            style={{
              backgroundColor: 'var(--ft-bg-input)',
              borderColor: 'var(--ft-border)',
              color: 'var(--ft-text-primary)',
            }}
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-md text-sm font-medium text-white transition-all focus:outline-none focus:ring-2 hover:bg-[var(--ft-accent-hover)]"
            style={{ backgroundColor: 'var(--ft-accent)' }}
          >
            Search
          </button>
        </div>
      </form>
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border"
          style={{ backgroundColor: 'var(--ft-accent-muted)', borderColor: 'var(--ft-accent-border)', color: 'var(--ft-accent)' }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--ft-text-muted)' }}>
          Results are fetched securely via an admin-only server-side lookup. The search term is treated as a literal prefix (wildcards are disabled).
        </p>
      </div>
    </div>
  )
}

// ── Shared theme-aware UI primitives ──────────────────────────────────────────

function FtAlert({ variant, message }: { variant: 'error' | 'success' | 'warning'; message: string }) {
  const key = `ft-${variant}` as 'ft-error' | 'ft-success' | 'ft-warning'
  return (
    <div
      className={`${key} mb-4 border rounded-md p-4 text-sm flex items-center gap-2`}
    >
      {variant === 'error' && (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      )}
      {variant === 'success' && (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      )}
      {message}
    </div>
  )
}

function FtEmpty({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl border p-8 text-center text-sm"
      style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)', color: 'var(--ft-text-muted)' }}
    >
      {message}
    </div>
  )
}

function FtTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)' }}>
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

function FtThead({ cols }: { cols: string[] }) {
  return (
    <thead style={{ backgroundColor: 'var(--ft-table-header-bg)', borderBottom: '1px solid var(--ft-table-divider)' }}>
      <tr>
        {cols.map((c) => (
          <th key={c} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ft-text-muted)' }}>
            {c}
          </th>
        ))}
      </tr>
    </thead>
  )
}
