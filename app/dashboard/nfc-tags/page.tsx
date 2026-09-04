import { createClient } from '@/utils/supabase/server'
import { registerNfcTag, deactivateNfcTag, reactivateNfcTag } from './actions'

export default async function NfcTagsPage(props: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const searchParams = await props.searchParams
  const actionError = searchParams.error
  const actionSuccess = searchParams.success

  const supabase = await createClient()

  // Fetch tags with their location name via RLS (scoped to admin's institution automatically)
  const { data: tags, error: tagsError } = await supabase
    .from('nfc_tags')
    .select('id, uid, is_active, created_at, locations(id, name, is_active)')
    .order('created_at', { ascending: false })

  // Fetch active locations for the registration form dropdown (RLS-scoped)
  const { data: activeLocations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true })

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">NFC Tags</h1>

      {actionSuccess && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          Tag action successful.
        </div>
      )}
      {actionError && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          Action failed: {actionError}
        </div>
      )}

      {/* Register Tag Form */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Register Tag</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {!activeLocations || activeLocations.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No active locations available. Create and activate a location before registering tags.
            </p>
          ) : (
            <RegisterTagForm activeLocations={activeLocations} />
          )}
        </div>
      </section>

      {/* Tags Table */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Registered Tags</h2>
        {tagsError && (
          <p className="text-red-600 text-sm mb-4">
            Error loading tags: {tagsError.message}
          </p>
        )}
        {!tagsError && (!tags || tags.length === 0) && (
          <p className="text-gray-500 text-sm">No NFC tags registered yet.</p>
        )}
        {tags && tags.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">UID</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Location</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tags.map((tag) => {
                  const loc = Array.isArray(tag.locations) ? tag.locations[0] : tag.locations
                  return (
                    <tr key={tag.id} className={!tag.is_active ? 'bg-gray-50' : ''}>
                      <td className={`px-6 py-4 font-mono text-xs font-medium ${!tag.is_active ? 'text-gray-400' : 'text-gray-900'}`}>
                        {tag.uid}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {loc?.name ?? '—'}
                        {loc && !loc.is_active && (
                          <span className="ml-1 text-xs text-gray-400">(inactive location)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {tag.is_active ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Active</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full font-medium">Inactive</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {tag.is_active ? (
                          <DeactivateTagForm tagId={tag.id} />
                        ) : (
                          <ReactivateTagForm tagId={tag.id} />
                        )}
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
    if (result.success) {
      redirect('/dashboard/nfc-tags?success=registered')
    } else {
      redirect(`/dashboard/nfc-tags?error=${encodeURIComponent(result.error || 'Failed to register')}`)
    }
  }

  return (
    <form action={submitForm} className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <label htmlFor="uid" className="block text-xs font-medium text-gray-700 mb-1">
          Tag UID
        </label>
        <input
          id="uid"
          name="uid"
          type="text"
          placeholder="e.g. 1D:FF:7C:1C:1A:10:80"
          required
          maxLength={29}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="w-full sm:w-56">
        <label htmlFor="location_id" className="block text-xs font-medium text-gray-700 mb-1">
          Location
        </label>
        <select
          id="location_id"
          name="location_id"
          required
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select location…</option>
          {activeLocations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700 font-medium"
        >
          Register
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
    if (result.success) {
      redirect('/dashboard/nfc-tags?success=deactivated')
    } else {
      redirect(`/dashboard/nfc-tags?error=${encodeURIComponent(result.error || 'Failed to deactivate')}`)
    }
  }

  return (
    <form action={deactivate}>
      <button
        type="submit"
        className="text-red-600 hover:text-red-800 text-xs font-medium"
        title="Deactivate tag"
      >
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
    if (result.success) {
      redirect('/dashboard/nfc-tags?success=reactivated')
    } else {
      redirect(`/dashboard/nfc-tags?error=${encodeURIComponent(result.error || 'Failed to reactivate')}`)
    }
  }

  return (
    <form action={reactivate}>
      <button
        type="submit"
        className="text-green-600 hover:text-green-800 text-xs font-medium"
        title="Reactivate tag"
      >
        Reactivate
      </button>
    </form>
  )
}
