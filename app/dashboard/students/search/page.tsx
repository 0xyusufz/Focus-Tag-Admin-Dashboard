import Link from 'next/link'
import { searchUnassignedUsers, assignUserToInstitution } from '../actions'

export default async function StudentSearchPage(props: {
  searchParams: Promise<{ q?: string; assigned?: string; error?: string }>
}) {
  const searchParams = await props.searchParams
  const query = String(searchParams.q || '').trim()
  const assignedId = searchParams.assigned
  const assignError = searchParams.error

  let results: { id: string; email: string; name: string }[] = []
  let searchError: string | null = null

  if (query.length >= 3) {
    const res = await searchUnassignedUsers(query)
    if (res.error) {
      searchError = res.error
    } else {
      results = res.data || []
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard/students" className="text-sm font-medium inline-flex items-center transition-colors hover:opacity-80" style={{ color: 'var(--ft-accent)' }}>
          &larr; Back to Students
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{ color: 'var(--ft-text-primary)' }}>Onboard Student</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--ft-text-secondary)' }}>
        Search for an unassigned FocusTag account and assign them to your institution.
      </p>

      {/* Search form */}
      <div className="rounded-xl border p-6 md:p-8 mb-8" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)' }}>
        <form action="/dashboard/students/search" className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            name="q"
            type="text"
            defaultValue={query}
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

      {/* Status messages */}
      {assignedId && !assignError && (
        <div className="ft-success mb-6 border rounded-md p-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          User successfully assigned to your institution.
        </div>
      )}
      {assignError && (
        <div className="ft-error mb-6 border rounded-md p-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          Assignment failed: {assignError}
        </div>
      )}
      {searchError && (
        <div className="ft-error mb-6 border rounded-md p-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          Search error: {searchError}
        </div>
      )}

      {/* Results */}
      {query.length >= 3 && !searchError && (
        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--ft-text-primary)' }}>Search Results</h2>
          {results.length === 0 ? (
            <div className="rounded-xl border p-8 text-center text-sm" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)', color: 'var(--ft-text-muted)' }}>
              No unassigned students found matching &quot;{query}&quot;.
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)' }}>
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: 'var(--ft-table-header-bg)', borderBottom: '1px solid var(--ft-table-divider)' }}>
                  <tr>
                    {['Name', 'Email', 'Action'].map((h, i) => (
                      <th key={h} className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${i === 2 ? 'text-right' : 'text-left'}`} style={{ color: 'var(--ft-text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((u, i) => (
                    <tr key={u.id} className="ft-table-row-hover transition-colors" style={{ borderTop: i > 0 ? '1px solid var(--ft-table-divider)' : undefined }}>
                      <td className="px-6 py-4 font-medium" style={{ color: 'var(--ft-text-primary)' }}>{u.name || '—'}</td>
                      <td className="px-6 py-4" style={{ color: 'var(--ft-text-secondary)' }}>{u.email}</td>
                      <td className="px-6 py-4 text-right">
                        <AssignForm userId={u.id} searchQuery={query} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function AssignForm({ userId, searchQuery }: { userId: string; searchQuery: string }) {
  async function assign(formData: FormData) {
    'use server'
    const { redirect } = await import('next/navigation')
    const id = String(formData.get('userId') || '').trim()
    if (!id) {
      redirect(`/dashboard/students/search?q=${encodeURIComponent(searchQuery)}&error=Invalid+ID`)
      return
    }
    const result = await assignUserToInstitution(id)
    if (result.success) {
      redirect(`/dashboard/students/search?q=${encodeURIComponent(searchQuery)}&assigned=${id}`)
    } else {
      redirect(
        `/dashboard/students/search?q=${encodeURIComponent(searchQuery)}&error=${encodeURIComponent(result.error || 'Unknown error')}`
      )
    }
  }

  return (
    <form action={assign}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
        style={{
          backgroundColor: 'var(--ft-success-bg)',
          color: 'var(--ft-success-text)',
        }}
      >
        Assign to Institution
      </button>
    </form>
  )
}
