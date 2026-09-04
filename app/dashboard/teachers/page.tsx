import { createClient } from '@/utils/supabase/server'
import { promoteStudentToTeacher } from './actions'

export default async function TeachersPage(props: {
  searchParams: Promise<{ promoted?: string; error?: string }>
}) {
  const searchParams = await props.searchParams
  const promotedId = searchParams.promoted
  const promoteError = searchParams.error

  const supabase = await createClient()

  // Fetch current institution teachers via normal authenticated client + RLS.
  const { data: teachers, error: teachersError } = await supabase
    .from('profiles')
    .select('id, name, role')
    .eq('role', 'teacher')
    .order('name', { ascending: true })

  // Fetch same-institution students eligible for promotion via normal RLS.
  const { data: students, error: studentsError } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('role', 'student')
    .order('name', { ascending: true })

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Teachers</h1>

      {/* Status messages */}
      {promotedId && !promoteError && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          Student successfully promoted to teacher.
        </div>
      )}
      {promoteError && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          Promotion failed: {promoteError}
        </div>
      )}

      {/* Current Institution Teachers */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Institution Teachers</h2>
        {teachersError && (
          <p className="text-red-600 text-sm mb-4">
            Error loading teachers: {teachersError.message}
          </p>
        )}
        {!teachersError && (!teachers || teachers.length === 0) && (
          <p className="text-gray-500 text-sm">No teachers are currently assigned to this institution.</p>
        )}
        {teachers && teachers.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teachers.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 text-gray-900">{t.name || '—'}</td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">{t.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Promote Student to Teacher */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Promote Student to Teacher</h2>
        <p className="text-sm text-gray-500 mb-4">
          Only students already assigned to this institution are eligible for promotion.
          This action cannot be reversed through this dashboard.
        </p>

        {studentsError && (
          <p className="text-red-600 text-sm">Error loading students: {studentsError.message}</p>
        )}
        {!studentsError && (!students || students.length === 0) && (
          <p className="text-gray-500 text-sm">
            No students in this institution are available for promotion.
          </p>
        )}
        {students && students.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="px-6 py-4 text-gray-900">{s.name || '—'}</td>
                    <td className="px-6 py-4">
                      <PromoteForm userId={s.id} />
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

function PromoteForm({ userId }: { userId: string }) {
  async function promote(formData: FormData) {
    'use server'
    const { redirect } = await import('next/navigation')
    const id = String(formData.get('userId') || '').trim()
    if (!id) {
      redirect('/dashboard/teachers?error=Invalid+ID')
      return
    }
    const result = await promoteStudentToTeacher(id)
    if (result.success) {
      redirect(`/dashboard/teachers?promoted=${id}`)
    } else {
      redirect(
        `/dashboard/teachers?error=${encodeURIComponent(result.error || 'Unknown error')}`
      )
    }
  }

  return (
    <form action={promote}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700"
      >
        Promote to Teacher
      </button>
    </form>
  )
}
