import { createClient } from '@/utils/supabase/server'
import { promoteStudentToTeacher } from './actions'

export default async function TeachersPage(props: {
  searchParams: Promise<{ promoted?: string; error?: string }>
}) {
  const searchParams = await props.searchParams
  const promotedId = searchParams.promoted
  const promoteError = searchParams.error

  const supabase = await createClient()

  const { data: teachers, error: teachersError } = await supabase
    .from('profiles').select('id, name, role').eq('role', 'teacher').order('name', { ascending: true })

  const { data: students, error: studentsError } = await supabase
    .from('profiles').select('id, name').eq('role', 'student').order('name', { ascending: true })

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--ft-text-primary)' }}>Teachers</h1>
        <p style={{ color: 'var(--ft-text-secondary)' }}>Manage teacher profiles and promote students.</p>
      </div>

      {promotedId && !promoteError && (
        <div className="ft-success mb-6 border rounded-md p-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Student successfully promoted to teacher.
        </div>
      )}
      {promoteError && (
        <div className="ft-error mb-6 border rounded-md p-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          Promotion failed: {promoteError}
        </div>
      )}

      {/* Institution Teachers */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--ft-text-primary)' }}>Institution Teachers</h2>
        {teachersError && (
          <div className="ft-error mb-4 border rounded-md p-4 text-sm">Error loading teachers: {teachersError.message}</div>
        )}
        {!teachersError && (!teachers || teachers.length === 0) && (
          <FtEmpty message="No teachers are currently assigned to this institution." />
        )}
        {teachers && teachers.length > 0 && (
          <FtTable>
            <FtThead cols={['Name', 'ID']} />
            <tbody>
              {teachers.map((t, i) => (
                <tr key={t.id} className="ft-table-row-hover transition-colors" style={{ borderTop: i > 0 ? '1px solid var(--ft-table-divider)' : undefined }}>
                  <td className="px-6 py-4 font-medium" style={{ color: 'var(--ft-text-primary)' }}>{t.name || '—'}</td>
                  <td className="px-6 py-4 font-mono text-xs" style={{ color: 'var(--ft-text-muted)' }}>{t.id}</td>
                </tr>
              ))}
            </tbody>
          </FtTable>
        )}
      </section>

      {/* Promote Student to Teacher */}
      <section>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--ft-text-primary)' }}>Promote Student to Teacher</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--ft-text-secondary)' }}>
          Only students already assigned to this institution are eligible for promotion. This action cannot be reversed through this dashboard.
        </p>
        {studentsError && (
          <div className="ft-error mb-4 border rounded-md p-4 text-sm">Error loading students: {studentsError.message}</div>
        )}
        {!studentsError && (!students || students.length === 0) && (
          <FtEmpty message="No students in this institution are available for promotion." />
        )}
        {students && students.length > 0 && (
          <FtTable>
            <FtThead cols={['Name', 'Action']} />
            <tbody>
              {students.map((s, i) => (
                <tr key={s.id} className="ft-table-row-hover transition-colors" style={{ borderTop: i > 0 ? '1px solid var(--ft-table-divider)' : undefined }}>
                  <td className="px-6 py-4 font-medium" style={{ color: 'var(--ft-text-primary)' }}>{s.name || '—'}</td>
                  <td className="px-6 py-4"><PromoteForm userId={s.id} /></td>
                </tr>
              ))}
            </tbody>
          </FtTable>
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
    if (!id) { redirect('/dashboard/teachers?error=Invalid+ID'); return }
    const result = await promoteStudentToTeacher(id)
    if (result.success) {
      redirect(`/dashboard/teachers?promoted=${id}`)
    } else {
      redirect(`/dashboard/teachers?error=${encodeURIComponent(result.error || 'Unknown error')}`)
    }
  }

  return (
    <form action={promote}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors focus:outline-none focus:ring-2 hover:bg-[var(--ft-accent)] hover:text-[#fff]"
        style={{
          backgroundColor: 'var(--ft-accent-muted)',
          borderColor: 'var(--ft-accent-border)',
          color: 'var(--ft-accent)',
        }}
      >
        Promote to Teacher
      </button>
    </form>
  )
}

function FtEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-xl border p-8 text-center text-sm" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)', color: 'var(--ft-text-muted)' }}>
      {message}
    </div>
  )
}

function FtTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)' }}>
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

function FtThead({ cols }: { cols: string[] }) {
  return (
    <thead style={{ backgroundColor: 'var(--ft-table-header-bg)', borderBottom: '1px solid var(--ft-table-divider)' }}>
      <tr>
        {cols.map((c) => (
          <th key={c} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ft-text-muted)' }}>{c}</th>
        ))}
      </tr>
    </thead>
  )
}
