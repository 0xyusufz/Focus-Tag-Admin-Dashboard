import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import {
  enrollStudent,
  removeStudent,
  assignTeacher,
  revokeTeacher,
} from './actions'

export default async function ClassDetailPage(props: {
  params: Promise<{ classId: string }>
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const { classId } = await props.params
  const searchParams = await props.searchParams
  const actionError = searchParams.error
  const actionSuccess = searchParams.success

  const supabase = await createClient()

  // 1. Fetch Class Detail
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select(`
      id,
      name,
      is_active,
      created_at,
      locations ( name )
    `)
    .eq('id', classId)
    .single()

  if (classError || !classData) {
    return (
      <div className="max-w-4xl">
        <Link
          href="/dashboard/classes"
          className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block font-medium"
        >
          &larr; Back to Classes
        </Link>
        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h1 className="text-xl font-bold text-red-600 mb-2">Access Denied or Class Not Found</h1>
          <p className="text-gray-600 text-sm">
            The requested class could not be loaded. It may not exist or belongs to another institution.
          </p>
        </div>
      </div>
    )
  }

  // Handle location name extraction safely
  const locRecord = Array.isArray(classData.locations) ? classData.locations[0] : classData.locations
  const locationName = (locRecord as { name?: string } | null)?.name || 'Unknown Location'

  // 2. Fetch Currently Enrolled Students
  const { data: enrollmentsData, error: enrollmentsError } = await supabase
    .from('enrollments')
    .select(`
      student_id,
      profiles:student_id ( id, name, role )
    `)
    .eq('class_id', classId)

  // 3. Fetch Currently Assigned Teachers
  const { data: teacherAccessData, error: teacherAccessError } = await supabase
    .from('teacher_class_access')
    .select(`
      teacher_id,
      profiles:teacher_id ( id, name, role )
    `)
    .eq('class_id', classId)

  // 4. Fetch Candidate Students (role = student, same institution via RLS)
  const { data: candidateStudentsData } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('role', 'student')
    .order('name', { ascending: true })

  // 5. Fetch Candidate Teachers (role = teacher, same institution via RLS)
  const { data: candidateTeachersData } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('role', 'teacher')
    .order('name', { ascending: true })

  // Map enrolled students & assigned teachers
  const enrolledStudentIds = new Set(
    (enrollmentsData || []).map((e) => e.student_id)
  )
  const assignedTeacherIds = new Set(
    (teacherAccessData || []).map((t) => t.teacher_id)
  )

  // Filter candidates not yet assigned
  const availableStudents = (candidateStudentsData || []).filter(
    (s) => !enrolledStudentIds.has(s.id)
  )
  const availableTeachers = (candidateTeachersData || []).filter(
    (t) => !assignedTeacherIds.has(t.id)
  )

  return (
    <div className="max-w-5xl space-y-8">
      {/* Navigation Header */}
      <div>
        <Link
          href="/dashboard/classes"
          className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block font-medium"
        >
          &larr; Back to Classes
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{classData.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Location: <span className="font-medium text-gray-700">{locationName}</span>
            </p>
          </div>
          <div>
            {classData.is_active ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                Active Class
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full font-medium">
                Inactive Class
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Notification Banners */}
      {actionSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          Action completed successfully.
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          Action failed: {actionError}
        </div>
      )}

      {/* Teachers Section */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Assigned Teachers</h2>
            <p className="text-xs text-gray-500 mt-1">
              Teachers with management and monitoring access for this class.
            </p>
          </div>
          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
            {assignedTeacherIds.size} {assignedTeacherIds.size === 1 ? 'Teacher' : 'Teachers'}
          </span>
        </div>

        {/* Add Teacher Form */}
        {classData.is_active && (
          <AddTeacherForm
            classId={classId}
            teachers={availableTeachers}
          />
        )}

        {/* Teacher List Table */}
        {teacherAccessError && (
          <p className="text-red-600 text-sm">Error loading teachers: {teacherAccessError.message}</p>
        )}
        {!teacherAccessError && assignedTeacherIds.size === 0 && (
          <p className="text-gray-500 text-sm italic">No teachers currently assigned to this class.</p>
        )}
        {teacherAccessData && teacherAccessData.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Teacher Name</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">ID</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teacherAccessData.map((item) => {
                  const profRec = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
                  const profileName = (profRec as { name?: string | null } | null)?.name || '—'
                  return (
                    <tr key={item.teacher_id}>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {profileName}
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                        {item.teacher_id}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <RevokeTeacherForm
                          classId={classId}
                          teacherId={item.teacher_id}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Students Section */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Enrolled Students</h2>
            <p className="text-xs text-gray-500 mt-1">
              Students officially registered in this class.
            </p>
          </div>
          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
            {enrolledStudentIds.size} {enrolledStudentIds.size === 1 ? 'Student' : 'Students'}
          </span>
        </div>

        {/* Add Student Form */}
        {classData.is_active ? (
          <EnrollStudentForm
            classId={classId}
            students={availableStudents}
          />
        ) : (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 p-3 rounded">
            Student enrollment is disabled while this class is inactive.
          </p>
        )}

        {/* Student List Table */}
        {enrollmentsError && (
          <p className="text-red-600 text-sm">Error loading students: {enrollmentsError.message}</p>
        )}
        {!enrollmentsError && enrolledStudentIds.size === 0 && (
          <p className="text-gray-500 text-sm italic">No students currently enrolled in this class.</p>
        )}
        {enrollmentsData && enrollmentsData.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Student Name</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">ID</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enrollmentsData.map((item) => {
                  const profRec = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
                  const profileName = (profRec as { name?: string | null } | null)?.name || '—'
                  return (
                    <tr key={item.student_id}>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {profileName}
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                        {item.student_id}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <RemoveStudentForm
                          classId={classId}
                          studentId={item.student_id}
                        />
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

function EnrollStudentForm({
  classId,
  students,
}: {
  classId: string
  students: { id: string; name: string | null }[]
}) {
  async function submitEnrollment(formData: FormData) {
    'use server'
    const studentId = String(formData.get('student_id') || '').trim()
    if (!studentId) {
      redirect(`/dashboard/classes/${classId}?error=Please+select+a+student`)
    }
    const result = await enrollStudent(classId, studentId)
    if (result.success) {
      redirect(`/dashboard/classes/${classId}?success=student_enrolled`)
    } else {
      redirect(
        `/dashboard/classes/${classId}?error=${encodeURIComponent(
          result.error || 'Failed to enroll student'
        )}`
      )
    }
  }

  return (
    <form action={submitEnrollment} className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <label htmlFor="student_id" className="block text-xs font-medium text-gray-700 mb-1">
          Select Student to Enroll
        </label>
        <select
          id="student_id"
          name="student_id"
          required
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose student from institution...</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.id}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={students.length === 0}
          className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2 rounded text-sm hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enroll Student
        </button>
      </div>
    </form>
  )
}

function AddTeacherForm({
  classId,
  teachers,
}: {
  classId: string
  teachers: { id: string; name: string | null }[]
}) {
  async function submitAssignment(formData: FormData) {
    'use server'
    const teacherId = String(formData.get('teacher_id') || '').trim()
    if (!teacherId) {
      redirect(`/dashboard/classes/${classId}?error=Please+select+a+teacher`)
    }
    const result = await assignTeacher(classId, teacherId)
    if (result.success) {
      redirect(`/dashboard/classes/${classId}?success=teacher_assigned`)
    } else {
      redirect(
        `/dashboard/classes/${classId}?error=${encodeURIComponent(
          result.error || 'Failed to assign teacher'
        )}`
      )
    }
  }

  return (
    <form action={submitAssignment} className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <label htmlFor="teacher_id" className="block text-xs font-medium text-gray-700 mb-1">
          Select Teacher to Assign
        </label>
        <select
          id="teacher_id"
          name="teacher_id"
          required
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose teacher from institution...</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name || t.id}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={teachers.length === 0}
          className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2 rounded text-sm hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Assign Teacher
        </button>
      </div>
    </form>
  )
}

function RemoveStudentForm({
  classId,
  studentId,
}: {
  classId: string
  studentId: string
}) {
  async function handleRemove() {
    'use server'
    const result = await removeStudent(classId, studentId)
    if (result.success) {
      redirect(`/dashboard/classes/${classId}?success=student_removed`)
    } else {
      redirect(
        `/dashboard/classes/${classId}?error=${encodeURIComponent(
          result.error || 'Failed to remove student'
        )}`
      )
    }
  }

  return (
    <form action={handleRemove}>
      <button
        type="submit"
        className="text-red-600 hover:text-red-800 text-xs font-medium"
      >
        Remove
      </button>
    </form>
  )
}

function RevokeTeacherForm({
  classId,
  teacherId,
}: {
  classId: string
  teacherId: string
}) {
  async function handleRevoke() {
    'use server'
    const result = await revokeTeacher(classId, teacherId)
    if (result.success) {
      redirect(`/dashboard/classes/${classId}?success=teacher_revoked`)
    } else {
      redirect(
        `/dashboard/classes/${classId}?error=${encodeURIComponent(
          result.error || 'Failed to revoke teacher access'
        )}`
      )
    }
  }

  return (
    <form action={handleRevoke}>
      <button
        type="submit"
        className="text-red-600 hover:text-red-800 text-xs font-medium"
      >
        Revoke Access
      </button>
    </form>
  )
}
