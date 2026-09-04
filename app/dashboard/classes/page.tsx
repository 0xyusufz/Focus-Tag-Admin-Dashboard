import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createClass, updateClassStatus } from './actions'

export default async function ClassesPage(props: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const searchParams = await props.searchParams
  const actionError = searchParams.error
  const actionSuccess = searchParams.success

  const supabase = await createClient()

  // Fetch active locations for the form
  const { data: locationsData } = await supabase
    .from('locations')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true })

  // Fetch classes with basic counts and location details
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select(`
      id, 
      name, 
      is_active, 
      created_at,
      locations ( name ),
      enrollments ( count ),
      teacher_class_access ( count )
    `)
    .order('name', { ascending: true })

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Classes</h1>

      {actionSuccess && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          Class action successful.
        </div>
      )}
      {actionError && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          Action failed: {actionError}
        </div>
      )}

      {/* Add Class Form */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Create Class</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <AddClassForm locations={locationsData || []} />
        </div>
      </section>

      {/* Current Classes */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Institution Classes</h2>
        {classesError && (
          <p className="text-red-600 text-sm mb-4">
            Error loading classes: {classesError.message}
          </p>
        )}
        {!classesError && (!classes || classes.length === 0) && (
          <p className="text-gray-500 text-sm">No classes are currently registered for this institution.</p>
        )}
        {classes && classes.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Location</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Teachers</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Students</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classes.map((cls) => {
                  // @ts-expect-error Supabase nested types
                  const locName = cls.locations?.name || 'Unknown'
                  const teacherCount = cls.teacher_class_access?.[0]?.count || 0
                  const studentCount = cls.enrollments?.[0]?.count || 0

                  return (
                    <tr key={cls.id} className={!cls.is_active ? 'bg-gray-50' : ''}>
                      <td className={`px-6 py-4 font-medium ${!cls.is_active ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {cls.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{locName}</td>
                      <td className="px-6 py-4 text-gray-600">{teacherCount}</td>
                      <td className="px-6 py-4 text-gray-600">{studentCount}</td>
                      <td className="px-6 py-4">
                        {cls.is_active ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Active</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full font-medium">Inactive</span>
                        )}
                      </td>
                      <td className="px-6 py-4 flex items-center gap-3">
                        <Link
                          href={`/dashboard/classes/${cls.id}`}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Manage
                        </Link>
                        <UpdateStatusForm classId={cls.id} currentStatus={cls.is_active} />
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

function AddClassForm({ locations }: { locations: { id: string, name: string }[] }) {
  async function submitForm(formData: FormData) {
    'use server'
    const { redirect } = await import('next/navigation')
    const result = await createClass(formData)
    if (result.success) {
      redirect('/dashboard/classes?success=created')
    } else {
      redirect(`/dashboard/classes?error=${encodeURIComponent(result.error || 'Failed to create')}`)
    }
  }

  return (
    <form action={submitForm} className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">Class Name</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="e.g. Physics 101"
          required
          maxLength={100}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="w-full sm:w-64">
        <label htmlFor="location_id" className="block text-xs font-medium text-gray-700 mb-1">Location</label>
        <select
          id="location_id"
          name="location_id"
          required
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select active location...</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700 font-medium"
        >
          Create
        </button>
      </div>
    </form>
  )
}

function UpdateStatusForm({ classId, currentStatus }: { classId: string, currentStatus: boolean }) {
  async function updateStatus() {
    'use server'
    const { redirect } = await import('next/navigation')
    const result = await updateClassStatus(classId, !currentStatus)
    const action = currentStatus ? 'deactivated' : 'activated'
    if (result.success) {
      redirect(`/dashboard/classes?success=${action}`)
    } else {
      redirect(`/dashboard/classes?error=${encodeURIComponent(result.error || `Failed to ${action}`)}`)
    }
  }

  return (
    <form action={updateStatus}>
      <button
        type="submit"
        className={`${currentStatus ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'} text-xs font-medium`}
        title={currentStatus ? "Deactivate class" : "Activate class"}
      >
        {currentStatus ? "Deactivate" : "Activate"}
      </button>
    </form>
  )
}
