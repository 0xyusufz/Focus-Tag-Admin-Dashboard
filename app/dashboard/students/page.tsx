import { createClient } from '@/utils/supabase/server'

export default async function StudentsPage() {
  const supabase = await createClient()

  // Fetch current institution students via normal authenticated client + RLS.
  // The profiles SELECT RLS policy scopes this to the admin's institution automatically.
  const { data: students, error: studentsError } = await supabase
    .from('profiles')
    .select('id, name, role')
    .eq('role', 'student')
    .order('name', { ascending: true })

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Students</h1>

      {/* Current Institution Students */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Institution Students</h2>
        {studentsError && (
          <p className="text-red-600 text-sm mb-4">
            Error loading students: {studentsError.message}
          </p>
        )}
        {!studentsError && (!students || students.length === 0) && (
          <p className="text-gray-500 text-sm">No students are currently assigned to this institution.</p>
        )}
        {students && students.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="px-6 py-4 text-gray-900">{s.name || '—'}</td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">{s.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Onboard Unassigned Student */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Onboard Student</h2>
        <p className="text-sm text-gray-500 mb-4">
          Search for an existing FocusTag account that is not yet assigned to any institution.
          Only accounts with role <strong>student</strong> and no institution are shown.
        </p>
        <OnboardSearch />
      </section>
    </div>
  )
}

// Client-interactive search section implemented as a server form with server action binding
function OnboardSearch() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <form action={handleSearch}>
        <div className="flex gap-3 mb-4">
          <input
            name="searchTerm"
            type="text"
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
        </div>
      </form>
      <p className="text-xs text-gray-400">
        Results are fetched securely via an admin-only server-side lookup. The search term is
        treated as a literal prefix (wildcards are disabled).
      </p>
    </div>
  )
}

// The search form submits to a dedicated search route to keep this page simple.
// Full interactive search with results is handled in students/search/page.tsx.
async function handleSearch(formData: FormData) {
  'use server'
  const { redirect } = await import('next/navigation')
  const term = String(formData.get('searchTerm') || '').trim()
  if (term.length >= 3) {
    redirect(`/dashboard/students/search?q=${encodeURIComponent(term)}`)
  }
}
