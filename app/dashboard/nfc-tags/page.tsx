import { createClient } from '@/utils/supabase/server'
import {
  getTagSessionStatus,
  registerNfcTag,
  deactivateNfcTag,
  reactivateNfcTag,
  reassignNfcTag,
} from './actions'

type TagRow = {
  id: string
  uid: string
  is_active: boolean
  created_at: string
  session_count?: number
  locations:
    | { id: string; name: string; is_active: boolean }
    | { id: string; name: string; is_active: boolean }[]
    | null
}

export default async function NfcTagsPage(props: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const searchParams = await props.searchParams
  const actionError = searchParams.error
  const actionSuccess = searchParams.success

  const supabase = await createClient()

  const { data: tags, error: tagsError } = await supabase
    .from('nfc_tags').select('id, uid, is_active, created_at, locations(id, name, is_active)').order('created_at', { ascending: false })

  const { data: activeLocations } = await supabase
    .from('locations').select('id, name').eq('is_active', true).order('name', { ascending: true })

  const sessionStatus: Record<string, boolean> =
    tags && tags.length > 0 ? await getTagSessionStatus(tags.map((t) => t.uid)) : {}

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--ft-text-primary)' }}>NFC Tags</h1>
        <p style={{ color: 'var(--ft-text-secondary)' }}>Register and manage NFC tags for physical locations.</p>
      </div>

      {actionSuccess && (
        <div className="ft-success mb-6 border rounded-md p-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Tag action successful.
        </div>
      )}
      {actionError && (
        <div className="ft-error mb-6 border rounded-md p-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          Action failed: {actionError}
        </div>
      )}

      {/* Register Tag */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--ft-text-primary)' }}>Register Tag</h2>
        <div className="rounded-xl border p-6 md:p-8" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)' }}>
          {!activeLocations || activeLocations.length === 0 ? (
            <div className="ft-warning flex items-start gap-2 border rounded-md p-4">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <p className="text-sm">No active locations available. Create and activate a location before registering tags.</p>
            </div>
          ) : (
            <RegisterTagForm activeLocations={activeLocations} />
          )}
        </div>
      </section>

      {/* Tags Table */}
      <section>
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--ft-text-primary)' }}>Registered Tags</h2>
        {tagsError && (
          <div className="ft-error mb-4 border rounded-md p-4 text-sm">Error loading tags: {tagsError.message}</div>
        )}
        {!tagsError && (!tags || tags.length === 0) && (
          <div className="rounded-xl border p-8 text-center text-sm" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)', color: 'var(--ft-text-muted)' }}>
            No NFC tags registered yet.
          </div>
        )}
        {tags && tags.length > 0 && (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)' }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: 'var(--ft-table-header-bg)', borderBottom: '1px solid var(--ft-table-divider)' }}>
                <tr>
                  {['UID', 'Location', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ft-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tags.map((tag, i) => {
                  const loc = Array.isArray(tag.locations) ? tag.locations[0] : (tag.locations as TagRow['locations'])
                  const locTyped = loc as { id: string; name: string; is_active: boolean } | null
                  const hasSessions = sessionStatus[tag.uid] ?? true

                  return (
                    <tr
                      key={tag.id}
                      className="ft-table-row-hover transition-colors"
                      style={{
                        borderTop: i > 0 ? '1px solid var(--ft-table-divider)' : undefined,
                        backgroundColor: !tag.is_active ? 'var(--ft-table-row-muted)' : undefined,
                      }}
                    >
                      <td className="px-6 py-4 font-mono text-xs font-medium" style={{ color: tag.is_active ? 'var(--ft-text-primary)' : 'var(--ft-text-disabled)' }}>
                        {tag.uid}
                      </td>
                      <td className="px-6 py-4" style={{ color: 'var(--ft-text-secondary)' }}>
                        {locTyped?.name ?? '—'}
                        {locTyped && !locTyped.is_active && (
                          <span className="ml-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--ft-text-disabled)' }}>(inactive)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full font-semibold border"
                          style={tag.is_active ? {
                            backgroundColor: 'var(--ft-badge-active-bg)', borderColor: 'var(--ft-badge-active-border)', color: 'var(--ft-badge-active-text)',
                          } : {
                            backgroundColor: 'var(--ft-badge-inactive-bg)', borderColor: 'var(--ft-badge-inactive-border)', color: 'var(--ft-badge-inactive-text)',
                          }}>
                          {tag.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          {tag.is_active ? <DeactivateTagForm tagId={tag.id} /> : <ReactivateTagForm tagId={tag.id} />}
                          {tag.is_active && !hasSessions && activeLocations && activeLocations.length > 0 && (
                            <ChangeLocationForm tagId={tag.id} currentLocationId={locTyped?.id ?? ''} activeLocations={activeLocations} />
                          )}
                          {tag.is_active && hasSessions && (
                            <span className="text-xs italic" style={{ color: 'var(--ft-text-muted)' }}
                              title="This tag has historical focus sessions. Its location is permanently locked.">
                              Location Locked
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function RegisterTagForm({ activeLocations }: { activeLocations: { id: string; name: string }[] }) {
  async function submitForm(formData: FormData) {
    'use server'
    const { redirect } = await import('next/navigation')
    const result = await registerNfcTag(formData)
    if (result.success) { redirect('/dashboard/nfc-tags?success=registered') }
    else { redirect(`/dashboard/nfc-tags?error=${encodeURIComponent(result.error || 'Failed to register')}`) }
  }

  return (
    <form action={submitForm} className="flex flex-col sm:flex-row gap-4 items-end">
      <div className="flex-1 w-full">
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ft-text-muted)' }}>Tag UID</label>
        <input name="uid" type="text" placeholder="e.g. 1D:FF:7C:1C:1A:10:80" required maxLength={29}
          className="ft-input w-full rounded-md border px-4 py-2.5 text-sm font-mono uppercase transition-all"
          style={{ backgroundColor: 'var(--ft-bg-input)', borderColor: 'var(--ft-border)', color: 'var(--ft-text-primary)' }} />
      </div>
      <div className="w-full sm:w-56">
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ft-text-muted)' }}>Location</label>
        <select name="location_id" required
          className="ft-select w-full rounded-md border px-4 py-2.5 text-sm transition-all"
          style={{ backgroundColor: 'var(--ft-bg-input)', borderColor: 'var(--ft-border)', color: 'var(--ft-text-primary)' }}>
          <option value="">Select location…</option>
          {activeLocations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
        </select>
      </div>
      <div className="w-full sm:w-auto">
        <button type="submit"
          className="w-full px-6 py-2.5 rounded-md text-sm font-medium text-white transition-all focus:outline-none focus:ring-2 hover:bg-[var(--ft-accent-hover)]"
          style={{ backgroundColor: 'var(--ft-accent)' }}
        >
          Register Tag
        </button>
      </div>
    </form>
  )
}

function DeactivateTagForm({ tagId }: { tagId: string }) {
  async function deactivate() {
    'use server'
    const { redirect } = await import('next/navigation')
    const result = await deactivateNfcTag(tagId)
    if (result.success) { redirect('/dashboard/nfc-tags?success=deactivated') }
    else { redirect(`/dashboard/nfc-tags?error=${encodeURIComponent(result.error || 'Failed to deactivate')}`) }
  }
  return (
    <form action={deactivate}>
      <button type="submit" className="px-3 py-1.5 rounded text-xs font-medium transition-colors w-24 text-left"
        style={{ backgroundColor: 'var(--ft-error-bg)', color: 'var(--ft-error-text)' }}>
        Deactivate
      </button>
    </form>
  )
}

function ReactivateTagForm({ tagId }: { tagId: string }) {
  async function reactivate() {
    'use server'
    const { redirect } = await import('next/navigation')
    const result = await reactivateNfcTag(tagId)
    if (result.success) { redirect('/dashboard/nfc-tags?success=reactivated') }
    else { redirect(`/dashboard/nfc-tags?error=${encodeURIComponent(result.error || 'Failed to reactivate')}`) }
  }
  return (
    <form action={reactivate}>
      <button type="submit" className="px-3 py-1.5 rounded text-xs font-medium transition-colors w-24 text-left"
        style={{ backgroundColor: 'var(--ft-success-bg)', color: 'var(--ft-success-text)' }}>
        Reactivate
      </button>
    </form>
  )
}

function ChangeLocationForm({ tagId, currentLocationId, activeLocations }: {
  tagId: string; currentLocationId: string; activeLocations: { id: string; name: string }[]
}) {
  const choices = activeLocations.filter(loc => loc.id !== currentLocationId)
  if (choices.length === 0) return null

  async function submitReassign(formData: FormData) {
    'use server'
    const { redirect } = await import('next/navigation')
    const newLocationId = String(formData.get('new_location_id') || '').trim()
    if (!newLocationId) { redirect(`/dashboard/nfc-tags?error=${encodeURIComponent('Please select a new location')}`); return }
    const result = await reassignNfcTag(tagId, newLocationId)
    if (result.success) { redirect('/dashboard/nfc-tags?success=reassigned') }
    else { redirect(`/dashboard/nfc-tags?error=${encodeURIComponent(result.error || 'Failed to change location')}`) }
  }

  return (
    <form action={submitReassign} className="flex items-center gap-2 mt-1">
      <select name="new_location_id" required
        className="ft-select rounded border px-2 py-1.5 text-xs w-32 transition-all"
        style={{ backgroundColor: 'var(--ft-bg-input)', borderColor: 'var(--ft-border)', color: 'var(--ft-text-primary)' }}>
        <option value="">Move to…</option>
        {choices.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
      </select>
      <button type="submit"
        className="px-2.5 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors"
        style={{ backgroundColor: 'var(--ft-accent-muted)', borderColor: 'var(--ft-accent-border)', color: 'var(--ft-accent)', border: '1px solid' }}>
        Move
      </button>
    </form>
  )
}
