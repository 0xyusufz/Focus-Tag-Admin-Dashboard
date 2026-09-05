import { createClient } from '@/utils/supabase/server'
import { createLocation, deactivateLocation, reactivateLocation } from './actions'

export default async function LocationsPage(props: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const searchParams = await props.searchParams
  const actionError = searchParams.error
  const actionSuccess = searchParams.success

  const supabase = await createClient()

  const { data: locations, error: locationsError } = await supabase
    .from('locations').select('id, name, type, is_active, created_at').order('name', { ascending: true })

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--ft-text-primary)' }}>Locations</h1>
        <p style={{ color: 'var(--ft-text-secondary)' }}>Manage physical locations for classes and sessions.</p>
      </div>

      {actionSuccess && (
        <div className="ft-success mb-6 border rounded-md p-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Location action successful.
        </div>
      )}
      {actionError && (
        <div className="ft-error mb-6 border rounded-md p-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          Action failed: {actionError}
        </div>
      )}

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--ft-text-primary)' }}>Add Location</h2>
        <div className="rounded-xl border p-6 md:p-8" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)' }}>
          <AddLocationForm />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--ft-text-primary)' }}>Institution Locations</h2>
        {locationsError && (
          <div className="ft-error mb-4 border rounded-md p-4 text-sm">Error loading locations: {locationsError.message}</div>
        )}
        {!locationsError && (!locations || locations.length === 0) && (
          <div className="rounded-xl border p-8 text-center text-sm" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)', color: 'var(--ft-text-muted)' }}>
            No locations are currently registered for this institution.
          </div>
        )}
        {locations && locations.length > 0 && (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)' }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: 'var(--ft-table-header-bg)', borderBottom: '1px solid var(--ft-table-divider)' }}>
                <tr>
                  {['Name', 'Type', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ft-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {locations.map((loc, i) => (
                  <tr
                    key={loc.id}
                    className="ft-table-row-hover transition-colors"
                    style={{
                      borderTop: i > 0 ? '1px solid var(--ft-table-divider)' : undefined,
                      backgroundColor: !loc.is_active ? 'var(--ft-table-row-muted)' : undefined,
                    }}
                  >
                    <td className="px-6 py-4 font-medium" style={{ color: loc.is_active ? 'var(--ft-text-primary)' : 'var(--ft-text-disabled)', textDecoration: loc.is_active ? undefined : 'line-through' }}>
                      {loc.name}
                    </td>
                    <td className="px-6 py-4 capitalize" style={{ color: 'var(--ft-text-secondary)' }}>{loc.type}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full font-semibold border"
                        style={loc.is_active ? {
                          backgroundColor: 'var(--ft-badge-active-bg)', borderColor: 'var(--ft-badge-active-border)', color: 'var(--ft-badge-active-text)',
                        } : {
                          backgroundColor: 'var(--ft-badge-inactive-bg)', borderColor: 'var(--ft-badge-inactive-border)', color: 'var(--ft-badge-inactive-text)',
                        }}>
                        {loc.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {loc.is_active ? <DeactivateForm locationId={loc.id} /> : <ReactivateForm locationId={loc.id} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function AddLocationForm() {
  async function submitForm(formData: FormData) {
    'use server'
    const { redirect } = await import('next/navigation')
    const result = await createLocation(formData)
    if (result.success) { redirect('/dashboard/locations?success=created') }
    else { redirect(`/dashboard/locations?error=${encodeURIComponent(result.error || 'Failed to create')}`) }
  }

  return (
    <form action={submitForm} className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ft-text-muted)' }}>Location Name</label>
        <input name="name" type="text" placeholder="e.g. Room 101" required maxLength={100}
          className="ft-input w-full rounded-md border px-4 py-2.5 text-sm transition-all"
          style={{ backgroundColor: 'var(--ft-bg-input)', borderColor: 'var(--ft-border)', color: 'var(--ft-text-primary)' }} />
      </div>
      <div className="w-full sm:w-48">
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ft-text-muted)' }}>Type</label>
        <select name="type" required
          className="ft-select w-full rounded-md border px-4 py-2.5 text-sm transition-all"
          style={{ backgroundColor: 'var(--ft-bg-input)', borderColor: 'var(--ft-border)', color: 'var(--ft-text-primary)' }}>
          <option value="classroom">Classroom</option>
          <option value="library">Library</option>
        </select>
      </div>
      <div className="flex items-end">
        <button type="submit"
          className="w-full sm:w-auto px-6 py-2.5 rounded-md text-sm font-medium text-white transition-all focus:outline-none focus:ring-2 hover:bg-[var(--ft-accent-hover)]"
          style={{ backgroundColor: 'var(--ft-accent)' }}
        >
          Add Location
        </button>
      </div>
    </form>
  )
}

function DeactivateForm({ locationId }: { locationId: string }) {
  async function deactivate() {
    'use server'
    const { redirect } = await import('next/navigation')
    const result = await deactivateLocation(locationId)
    if (result.success) { redirect('/dashboard/locations?success=deactivated') }
    else { redirect(`/dashboard/locations?error=${encodeURIComponent(result.error || 'Failed to deactivate')}`) }
  }
  return (
    <form action={deactivate}>
      <button type="submit" className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
        style={{ backgroundColor: 'var(--ft-error-bg)', color: 'var(--ft-error-text)' }}>
        Deactivate
      </button>
    </form>
  )
}

function ReactivateForm({ locationId }: { locationId: string }) {
  async function reactivate() {
    'use server'
    const { redirect } = await import('next/navigation')
    const result = await reactivateLocation(locationId)
    if (result.success) { redirect('/dashboard/locations?success=reactivated') }
    else { redirect(`/dashboard/locations?error=${encodeURIComponent(result.error || 'Failed to reactivate')}`) }
  }
  return (
    <form action={reactivate}>
      <button type="submit" className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
        style={{ backgroundColor: 'var(--ft-success-bg)', color: 'var(--ft-success-text)' }}>
        Reactivate
      </button>
    </form>
  )
}
