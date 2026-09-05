import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { enrollStudent, removeStudent, assignTeacher, revokeTeacher } from './actions'

export default async function ClassDetailPage(props: {
  params: Promise<{ classId: string }>
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const { classId } = await props.params
  const searchParams = await props.searchParams
  const actionError = searchParams.error
  const actionSuccess = searchParams.success

  const supabase = await createClient()

  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('id, name, is_active, created_at, locations ( name )')
    .eq('id', classId)
    .single()

  if (classError || !classData) {
    return (
      <div className="max-w-5xl">
        <Link href="/dashboard/classes" className="text-sm font-medium mb-6 inline-flex items-center transition-colors" style={{ color: 'var(--ft-accent)' }}>
          &larr; Back to Classes
        </Link>
        <div className="p-8 rounded-xl border" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-error-border)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--ft-error-text)' }} />
            <h1 className="text-xl font-bold" style={{ color: 'var(--ft-error-text)' }}>Access Denied or Class Not Found</h1>
          </div>
          <p className="text-sm pl-5 leading-relaxed" style={{ color: 'var(--ft-text-secondary)' }}>
            The requested class could not be loaded. It may not exist or belongs to another institution.
          </p>
        </div>
      </div>
    )
  }

  const locRecord = Array.isArray(classData.locations) ? classData.locations[0] : classData.locations
  const locationName = (locRecord as { name?: string } | null)?.name || 'Unknown Location'

  const { data: enrollmentsData, error: enrollmentsError } = await supabase
    .from('enrollments').select('student_id, profiles:student_id ( id, name, role )').eq('class_id', classId)

  const { data: teacherAccessData, error: teacherAccessError } = await supabase
    .from('teacher_class_access').select('teacher_id, profiles:teacher_id ( id, name, role )').eq('class_id', classId)

  const { data: candidateStudentsData } = await supabase
    .from('profiles').select('id, name').eq('role', 'student').order('name', { ascending: true })

  const { data: candidateTeachersData } = await supabase
    .from('profiles').select('id, name').eq('role', 'teacher').order('name', { ascending: true })

  const enrolledStudentIds = new Set((enrollmentsData || []).map((e) => e.student_id))
  const assignedTeacherIds = new Set((teacherAccessData || []).map((t) => t.teacher_id))

  const availableStudents = (candidateStudentsData || []).filter((s) => !enrolledStudentIds.has(s.id))
  const availableTeachers = (candidateTeachersData || []).filter((t) => !assignedTeacherIds.has(t.id))

  return (
    <div className="max-w-5xl space-y-8">
      {/* Navigation + Header */}
      <div>
        <Link href="/dashboard/classes" className="text-sm font-medium mb-6 inline-flex items-center transition-colors hover:opacity-80" style={{ color: 'var(--ft-accent)' }}>
          &larr; Back to Classes
        </Link>
        <div className="flex items-center justify-between mt-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--ft-text-primary)' }}>{classData.name}</h1>
            <p className="text-sm mt-2 flex items-center gap-2" style={{ color: 'var(--ft-text-secondary)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span>Location: <strong style={{ color: 'var(--ft-text-primary)' }}>{locationName}</strong></span>
            </p>
          </div>
          <span className="px-3 py-1 text-xs rounded-full font-medium border"
            style={classData.is_active ? {
              backgroundColor: 'var(--ft-badge-active-bg)', borderColor: 'var(--ft-badge-active-border)', color: 'var(--ft-badge-active-text)',
            } : {
              backgroundColor: 'var(--ft-badge-inactive-bg)', borderColor: 'var(--ft-badge-inactive-border)', color: 'var(--ft-badge-inactive-text)',
            }}>
            {classData.is_active ? 'Active Class' : 'Inactive Class'}
          </span>
        </div>
      </div>

      {/* Banners */}
      {actionSuccess && (
        <div className="ft-success border rounded-md p-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Action completed successfully.
        </div>
      )}
      {actionError && (
        <div className="ft-error border rounded-md p-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          Action failed: {actionError}
        </div>
      )}

      {/* Teachers Section */}
      <section className="rounded-xl border p-6 md:p-8 space-y-6" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)' }}>
        <div className="flex items-center justify-between pb-5 border-b" style={{ borderColor: 'var(--ft-border)' }}>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--ft-text-primary)' }}>Assigned Teachers</h2>
            <p className="text-xs mt-1.5" style={{ color: 'var(--ft-text-muted)' }}>Teachers with management and monitoring access for this class.</p>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full border"
            style={{ backgroundColor: 'var(--ft-accent-muted)', borderColor: 'var(--ft-accent-border)', color: 'var(--ft-accent)' }}>
            {assignedTeacherIds.size} {assignedTeacherIds.size === 1 ? 'Teacher' : 'Teachers'}
          </span>
        </div>

        {classData.is_active && <AddTeacherForm classId={classId} teachers={availableTeachers} />}

        {teacherAccessError && (
          <div className="ft-error border rounded-md p-4 text-sm">Error loading teachers: {teacherAccessError.message}</div>
        )}
        {!teacherAccessError && assignedTeacherIds.size === 0 && (
          <div className="text-center p-6 border border-dashed rounded-lg text-sm" style={{ borderColor: 'var(--ft-border)', color: 'var(--ft-text-muted)' }}>
            No teachers currently assigned to this class.
          </div>
        )}
        {teacherAccessData && teacherAccessData.length > 0 && (
          <div className="rounded-lg border overflow-hidden mt-4" style={{ borderColor: 'var(--ft-border)' }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: 'var(--ft-table-header-bg)', borderBottom: '1px solid var(--ft-table-divider)' }}>
                <tr>
                  {['Teacher Name', 'ID', 'Action'].map((h, i) => (
                    <th key={h} className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${i === 2 ? 'text-right' : 'text-left'}`} style={{ color: 'var(--ft-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teacherAccessData.map((item, i) => {
                  const profRec = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
                  const profileName = (profRec as { name?: string | null } | null)?.name || '—'
                  return (
                    <tr key={item.teacher_id} className="ft-table-row-hover transition-colors" style={{ borderTop: i > 0 ? '1px solid var(--ft-table-divider)' : undefined }}>
                      <td className="px-6 py-4 font-medium" style={{ color: 'var(--ft-text-primary)' }}>{profileName}</td>
                      <td className="px-6 py-4 font-mono text-xs" style={{ color: 'var(--ft-text-muted)' }}>{item.teacher_id}</td>
                      <td className="px-6 py-4 text-right"><RevokeTeacherForm classId={classId} teacherId={item.teacher_id} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Students Section */}
      <section className="rounded-xl border p-6 md:p-8 space-y-6" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)' }}>
        <div className="flex items-center justify-between pb-5 border-b" style={{ borderColor: 'var(--ft-border)' }}>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--ft-text-primary)' }}>Enrolled Students</h2>
            <p className="text-xs mt-1.5" style={{ color: 'var(--ft-text-muted)' }}>Students officially registered in this class.</p>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full border"
            style={{ backgroundColor: 'var(--ft-accent-muted)', borderColor: 'var(--ft-accent-border)', color: 'var(--ft-accent)' }}>
            {enrolledStudentIds.size} {enrolledStudentIds.size === 1 ? 'Student' : 'Students'}
          </span>
        </div>

        {classData.is_active ? (
          <EnrollStudentForm classId={classId} students={availableStudents} />
        ) : (
          <div className="ft-warning flex items-start gap-2 border rounded-md p-4">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="text-xs leading-relaxed">Student enrollment is disabled while this class is inactive.</p>
          </div>
        )}

        {enrollmentsError && (
          <div className="ft-error border rounded-md p-4 text-sm">Error loading students: {enrollmentsError.message}</div>
        )}
        {!enrollmentsError && enrolledStudentIds.size === 0 && (
          <div className="text-center p-6 border border-dashed rounded-lg text-sm" style={{ borderColor: 'var(--ft-border)', color: 'var(--ft-text-muted)' }}>
            No students currently enrolled in this class.
          </div>
        )}
        {enrollmentsData && enrollmentsData.length > 0 && (
          <div className="rounded-lg border overflow-hidden mt-4" style={{ borderColor: 'var(--ft-border)' }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: 'var(--ft-table-header-bg)', borderBottom: '1px solid var(--ft-table-divider)' }}>
                <tr>
                  {['Student Name', 'ID', 'Action'].map((h, i) => (
                    <th key={h} className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${i === 2 ? 'text-right' : 'text-left'}`} style={{ color: 'var(--ft-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enrollmentsData.map((item, i) => {
                  const profRec = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
                  const profileName = (profRec as { name?: string | null } | null)?.name || '—'
                  return (
                    <tr key={item.student_id} className="ft-table-row-hover transition-colors" style={{ borderTop: i > 0 ? '1px solid var(--ft-table-divider)' : undefined }}>
                      <td className="px-6 py-4 font-medium" style={{ color: 'var(--ft-text-primary)' }}>{profileName}</td>
                      <td className="px-6 py-4 font-mono text-xs" style={{ color: 'var(--ft-text-muted)' }}>{item.student_id}</td>
                      <td className="px-6 py-4 text-right"><RemoveStudentForm classId={classId} studentId={item.student_id} /></td>
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

// ── Sub-forms ─────────────────────────────────────────────────────────────────

function EnrollStudentForm({ classId, students }: { classId: string; students: { id: string; name: string | null }[] }) {
  async function submitEnrollment(formData: FormData) {
    'use server'
    const studentId = String(formData.get('student_id') || '').trim()
    if (!studentId) redirect(`/dashboard/classes/${classId}?error=Please+select+a+student`)
    const result = await enrollStudent(classId, studentId)
    if (result.success) { redirect(`/dashboard/classes/${classId}?success=student_enrolled`) }
    else { redirect(`/dashboard/classes/${classId}?error=${encodeURIComponent(result.error || 'Failed to enroll student')}`) }
  }

  return (
    <form action={submitEnrollment} className="flex flex-col sm:flex-row gap-4 items-end">
      <div className="flex-1 w-full">
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ft-text-muted)' }}>Select Student to Enroll</label>
        <select name="student_id" required
          className="ft-select w-full rounded-md border px-4 py-2.5 text-sm transition-all"
          style={{ backgroundColor: 'var(--ft-bg-input)', borderColor: 'var(--ft-border)', color: 'var(--ft-text-primary)' }}>
          <option value="">Choose student from institution...</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name || s.id}</option>)}
        </select>
      </div>
      <div className="w-full sm:w-auto">
        <button type="submit" disabled={students.length === 0}
          className="w-full px-6 py-2.5 rounded-md text-sm font-medium text-white transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--ft-accent-hover)]"
          style={{ backgroundColor: 'var(--ft-accent)' }}
        >
          Enroll Student
        </button>
      </div>
    </form>
  )
}

function AddTeacherForm({ classId, teachers }: { classId: string; teachers: { id: string; name: string | null }[] }) {
  async function submitAssignment(formData: FormData) {
    'use server'
    const teacherId = String(formData.get('teacher_id') || '').trim()
    if (!teacherId) redirect(`/dashboard/classes/${classId}?error=Please+select+a+teacher`)
    const result = await assignTeacher(classId, teacherId)
    if (result.success) { redirect(`/dashboard/classes/${classId}?success=teacher_assigned`) }
    else { redirect(`/dashboard/classes/${classId}?error=${encodeURIComponent(result.error || 'Failed to assign teacher')}`) }
  }

  return (
    <form action={submitAssignment} className="flex flex-col sm:flex-row gap-4 items-end">
      <div className="flex-1 w-full">
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ft-text-muted)' }}>Select Teacher to Assign</label>
        <select name="teacher_id" required
          className="ft-select w-full rounded-md border px-4 py-2.5 text-sm transition-all"
          style={{ backgroundColor: 'var(--ft-bg-input)', borderColor: 'var(--ft-border)', color: 'var(--ft-text-primary)' }}>
          <option value="">Choose teacher from institution...</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name || t.id}</option>)}
        </select>
      </div>
      <div className="w-full sm:w-auto">
        <button type="submit" disabled={teachers.length === 0}
          className="w-full px-6 py-2.5 rounded-md text-sm font-medium text-white transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--ft-accent-hover)]"
          style={{ backgroundColor: 'var(--ft-accent)' }}
        >
          Assign Teacher
        </button>
      </div>
    </form>
  )
}

function RemoveStudentForm({ classId, studentId }: { classId: string; studentId: string }) {
  async function handleRemove() {
    'use server'
    const result = await removeStudent(classId, studentId)
    if (result.success) { redirect(`/dashboard/classes/${classId}?success=student_removed`) }
    else { redirect(`/dashboard/classes/${classId}?error=${encodeURIComponent(result.error || 'Failed to remove student')}`) }
  }
  return (
    <form action={handleRemove}>
      <button type="submit" className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
        style={{ backgroundColor: 'var(--ft-error-bg)', color: 'var(--ft-error-text)' }}>
        Remove
      </button>
    </form>
  )
}

function RevokeTeacherForm({ classId, teacherId }: { classId: string; teacherId: string }) {
  async function handleRevoke() {
    'use server'
    const result = await revokeTeacher(classId, teacherId)
    if (result.success) { redirect(`/dashboard/classes/${classId}?success=teacher_revoked`) }
    else { redirect(`/dashboard/classes/${classId}?error=${encodeURIComponent(result.error || 'Failed to revoke teacher access')}`) }
  }
  return (
    <form action={handleRevoke}>
      <button type="submit" className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
        style={{ backgroundColor: 'var(--ft-error-bg)', color: 'var(--ft-error-text)' }}>
        Revoke Access
      </button>
    </form>
  )
}
