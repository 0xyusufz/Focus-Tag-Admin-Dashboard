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
        <a href="/dashboard/students" className="text-sm text-blue-600 hover:underline">
          ← Back to Students
        </a>
      </div>
      <h1 className="text-3xl font-bold mb-2">Onboard Student</h1>
      <p className="text-sm text-gray-500 mb-6">
        Search for an unassigned FocusTag account and assign them to your institution.
      </p>

      {/* Search form */}
      <form action="/dashboard/students/search" className="flex gap-3 mb-6">
        <input
          name="q"
          type="text"
          defaultValue={query}
          placeholder="Search by email prefix (min. 3 chars)"
          minLength={3}
          maxLength={254}
          required
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          Search
        </button>
      </form>

      {/* Status messages */}
      {assignedId && !assignError && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          User successfully assigned to your institution.
        </div>
      )}
      {assignError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          Assignment failed: {assignError}
        </div>
      )}
      {searchError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          Search error: {searchError}
        </div>
      )}

      {/* Results */}
      {query.length >= 3 && !searchError && (
        <>
          {results.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No unassigned students found matching &quot;{query}&quot;.
            </p>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Email</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 text-gray-900">{u.name || '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <AssignForm userId={u.id} searchQuery={query} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
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
        className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
      >
        Assign to Institution
      </button>
    </form>
  )
}
