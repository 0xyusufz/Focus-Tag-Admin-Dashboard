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

  const { data: locationsData } = await supabase
    .from('locations').select('id, name').eq('is_active', true).order('name', { ascending: true })

  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, name, is_active, created_at, locations ( name ), enrollments ( count ), teacher_class_access ( count )')
    .order('name', { ascending: true })

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--ft-text-primary)' }}>Classes</h1>
        <p style={{ color: 'var(--ft-text-secondary)' }}>Manage your institution&apos;s classes, enrollments, and teacher assignments.</p>
      </div>

      {actionSuccess && (
        <div className="ft-success mb-6 border rounded-md p-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Class action successful.
        </div>
      )}
      {actionError && (
        <div className="ft-error mb-6 border rounded-md p-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          Action failed: {actionError}
        </div>
      )}

      {/* Create Class */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--ft-text-primary)' }}>Create Class</h2>
        <div className="rounded-xl border p-6 md:p-8" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)' }}>
          <AddClassForm locations={locationsData || []} />
        </div>
      </section>

      {/* Classes list */}
      <section>
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--ft-text-primary)' }}>Institution Classes</h2>
        {classesError && (
          <div className="ft-error mb-4 border rounded-md p-4 text-sm">Error loading classes: {classesError.message}</div>
        )}
        {!classesError && (!classes || classes.length === 0) && (
          <div className="rounded-xl border p-8 text-center text-sm" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)', color: 'var(--ft-text-muted)' }}>
            No classes are currently registered for this institution.
          </div>
        )}
        {classes && classes.length > 0 && (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)' }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: 'var(--ft-table-header-bg)', borderBottom: '1px solid var(--ft-table-divider)' }}>
                <tr>
                  {['Name', 'Location', 'Teachers', 'Students', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ft-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classes.map((cls, i) => {
                  // @ts-expect-error Supabase nested types
                  const locName = cls.locations?.name || 'Unknown'
                  const teacherCount = cls.teacher_class_access?.[0]?.count || 0
                  const studentCount = cls.enrollments?.[0]?.count || 0
                  return (
                    <tr
                      key={cls.id}
                      className="ft-table-row-hover transition-colors"
                      style={{
                        borderTop: i > 0 ? '1px solid var(--ft-table-divider)' : undefined,
                        backgroundColor: !cls.is_active ? 'var(--ft-table-row-muted)' : undefined,
                      }}
                    >
                      <td className="px-6 py-4 font-medium" style={{ color: cls.is_active ? 'var(--ft-text-primary)' : 'var(--ft-text-disabled)', textDecoration: cls.is_active ? undefined : 'line-through' }}>
                        {cls.name}
                      </td>
                      <td className="px-6 py-4" style={{ color: 'var(--ft-text-secondary)' }}>{locName}</td>
                      <td className="px-6 py-4" style={{ color: 'var(--ft-text-secondary)' }}>{teacherCount}</td>
                      <td className="px-6 py-4" style={{ color: 'var(--ft-text-secondary)' }}>{studentCount}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full font-semibold border"
                          style={cls.is_active ? {
                            backgroundColor: 'var(--ft-badge-active-bg)', borderColor: 'var(--ft-badge-active-border)', color: 'var(--ft-badge-active-text)',
                          } : {
                            backgroundColor: 'var(--ft-badge-inactive-bg)', borderColor: 'var(--ft-badge-inactive-border)', color: 'var(--ft-badge-inactive-text)',
                          }}>
                          {cls.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/classes/${cls.id}`}
                            className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors hover:bg-[var(--ft-accent)] hover:text-[#fff]"
                            style={{ backgroundColor: 'var(--ft-accent-muted)', borderColor: 'var(--ft-accent-border)', color: 'var(--ft-accent)' }}
                          >
                            Manage
                          </Link>
                          <UpdateStatusForm classId={cls.id} currentStatus={cls.is_active} />
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

function AddClassForm({ locations }: { locations: { id: string; name: string }[] }) {
  async function submitForm(formData: FormData) {
    'use server'
    const { redirect } = await import('next/navigation')
    const result = await createClass(formData)
    if (result.success) { redirect('/dashboard/classes?success=created') }
    else { redirect(`/dashboard/classes?error=${encodeURIComponent(result.error || 'Failed to create')}`) }
  }

  return (
    <form action={submitForm} className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ft-text-muted)' }}>Class Name</label>
        <input name="name" type="text" placeholder="e.g. Physics 101" required maxLength={100}
          className="ft-input w-full rounded-md border px-4 py-2.5 text-sm transition-all"
          style={{ backgroundColor: 'var(--ft-bg-input)', borderColor: 'var(--ft-border)', color: 'var(--ft-text-primary)' }} />
      </div>
      <div className="w-full sm:w-64">
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ft-text-muted)' }}>Location</label>
        <select name="location_id" required
          className="ft-select w-full rounded-md border px-4 py-2.5 text-sm transition-all"
          style={{ backgroundColor: 'var(--ft-bg-input)', borderColor: 'var(--ft-border)', color: 'var(--ft-text-primary)' }}>
          <option value="">Select active location...</option>
          {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
        </select>
      </div>
      <div className="flex items-end">
        <button type="submit"
          className="w-full sm:w-auto px-6 py-2.5 rounded-md text-sm font-medium text-white transition-all focus:outline-none focus:ring-2 hover:bg-[var(--ft-accent-hover)]"
          style={{ backgroundColor: 'var(--ft-accent)' }}
        >
          Create Class
        </button>
      </div>
    </form>
  )
}

function UpdateStatusForm({ classId, currentStatus }: { classId: string; currentStatus: boolean }) {
  async function updateStatus() {
    'use server'
    const { redirect } = await import('next/navigation')
    const result = await updateClassStatus(classId, !currentStatus)
    const action = currentStatus ? 'deactivated' : 'activated'
    if (result.success) { redirect(`/dashboard/classes?success=${action}`) }
    else { redirect(`/dashboard/classes?error=${encodeURIComponent(result.error || `Failed to ${action}`)}`) }
  }

  return (
    <form action={updateStatus}>
      <button type="submit"
        className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
        style={currentStatus ? {
          backgroundColor: 'var(--ft-error-bg)', color: 'var(--ft-error-text)',
        } : {
          backgroundColor: 'var(--ft-success-bg)', color: 'var(--ft-success-text)',
        }}
      >
        {currentStatus ? 'Deactivate' : 'Activate'}
      </button>
    </form>
  )
}
