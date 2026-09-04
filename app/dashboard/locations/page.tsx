import { createClient } from '@/utils/supabase/server'
import { createLocation, deactivateLocation, reactivateLocation } from './actions'

export default async function LocationsPage(props: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const searchParams = await props.searchParams
  const actionError = searchParams.error
  const actionSuccess = searchParams.success

  const supabase = await createClient()

  // Fetch locations via normal RLS. The SELECT policy automatically scopes to the admin's institution.
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('id, name, type, is_active, created_at')
    .order('name', { ascending: true })

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Locations</h1>

      {/* Status messages via search params redirect logic would normally go here, 
          but for simplicity in this file we'll use action forms that redirect with params if needed,
          or use a client component for state. Since we are using standard server actions without JS, 
          we can render errors passed in searchParams. */}
      {actionSuccess && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          Location action successful.
        </div>
      )}
      {actionError && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          Action failed: {actionError}
        </div>
      )}

      {/* Add Location Form */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Add Location</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <AddLocationForm />
        </div>
      </section>

      {/* Current Locations */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Institution Locations</h2>
        {locationsError && (
          <p className="text-red-600 text-sm mb-4">
            Error loading locations: {locationsError.message}
          </p>
        )}
        {!locationsError && (!locations || locations.length === 0) && (
          <p className="text-gray-500 text-sm">No locations are currently registered for this institution.</p>
        )}
        {locations && locations.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Type</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {locations.map((loc) => (
                  <tr key={loc.id} className={!loc.is_active ? 'bg-gray-50' : ''}>
                    <td className={`px-6 py-4 font-medium ${!loc.is_active ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {loc.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{loc.type}</td>
                    <td className="px-6 py-4">
                      {loc.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Active</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full font-medium">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {loc.is_active ? (
                        <DeactivateForm locationId={loc.id} />
                      ) : (
                        <ReactivateForm locationId={loc.id} />
                      )}
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
    if (result.success) {
      redirect('/dashboard/locations?success=created')
    } else {
      redirect(`/dashboard/locations?error=${encodeURIComponent(result.error || 'Failed to create')}`)
    }
  }

  return (
    <form action={submitForm} className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">Location Name</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="e.g. Room 101"
          required
          maxLength={100}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="w-full sm:w-48">
        <label htmlFor="type" className="block text-xs font-medium text-gray-700 mb-1">Type</label>
        <select
          id="type"
          name="type"
          required
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="classroom">Classroom</option>
          <option value="library">Library</option>
        </select>
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700 font-medium"
        >
          Add
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
    if (result.success) {
      redirect('/dashboard/locations?success=deactivated')
    } else {
      redirect(`/dashboard/locations?error=${encodeURIComponent(result.error || 'Failed to deactivate')}`)
    }
  }

  return (
    <form action={deactivate}>
      <button
        type="submit"
        className="text-red-600 hover:text-red-800 text-xs font-medium"
        title="Deactivate location"
      >
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
    if (result.success) {
      redirect('/dashboard/locations?success=reactivated')
    } else {
      redirect(`/dashboard/locations?error=${encodeURIComponent(result.error || 'Failed to reactivate')}`)
    }
  }

  return (
    <form action={reactivate}>
      <button
        type="submit"
        className="text-green-600 hover:text-green-800 text-xs font-medium"
        title="Reactivate location"
      >
        Reactivate
      </button>
    </form>
  )
}
