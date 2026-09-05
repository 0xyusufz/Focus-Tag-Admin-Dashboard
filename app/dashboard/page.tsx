import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { count: studentsCount },
    { count: teachersCount },
    { count: classesCount },
    { count: locationsCount },
    { count: nfcTagsCount },
    { data: recentClasses },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('classes').select('*', { count: 'exact', head: true }),
    supabase.from('locations').select('*', { count: 'exact', head: true }),
    supabase.from('nfc_tags').select('*', { count: 'exact', head: true }),
    supabase
      .from('classes')
      .select('id, name, is_active, locations ( name ), enrollments ( count ), teacher_class_access ( count )')
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  return (
    <div className="w-full space-y-10">
      {/* Page header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-3" style={{ color: 'var(--ft-text-primary)' }}>
          Overview
        </h1>
        <p className="text-lg" style={{ color: 'var(--ft-text-secondary)' }}>
          Manage your institution&apos;s students, teachers, classes, locations, and NFC tags.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        <MetricCard label="Total Students" value={studentsCount ?? 0} icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        } />
        <MetricCard label="Total Teachers" value={teachersCount ?? 0} icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        } />
        <MetricCard label="Active Classes" value={classesCount ?? 0} icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        } />
        <MetricCard label="Locations" value={locationsCount ?? 0} icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        } />
        <MetricCard label="NFC Tags" value={nfcTagsCount ?? 0} icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
        } />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Classes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--ft-border)' }}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--ft-text-primary)' }}>
              Recent Classes
            </h2>
            <Link
              href="/dashboard/classes"
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--ft-accent)' }}
            >
              View All &rarr;
            </Link>
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)' }}>
            {recentClasses && recentClasses.length > 0 ? (
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: 'var(--ft-table-header-bg)', borderBottom: '1px solid var(--ft-table-divider)' }}>
                  <tr>
                    {['Class', 'Location', 'Students', 'Status'].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ft-text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentClasses.map((cls, i) => {
                    const loc = Array.isArray(cls.locations) ? cls.locations[0] : cls.locations
                    const locName = (loc as { name?: string })?.name || '—'
                    const enrollCount = Array.isArray(cls.enrollments)
                      ? (cls.enrollments[0] as { count?: number })?.count ?? 0
                      : (cls.enrollments as { count?: number })?.count ?? 0
                    return (
                      <tr
                        key={cls.id}
                        className="ft-table-row-hover transition-colors"
                        style={{ borderTop: i > 0 ? '1px solid var(--ft-table-divider)' : undefined }}
                      >
                        <td className="px-6 py-4 font-medium" style={{ color: 'var(--ft-text-primary)' }}>{cls.name}</td>
                        <td className="px-6 py-4" style={{ color: 'var(--ft-text-secondary)' }}>{locName}</td>
                        <td className="px-6 py-4 font-mono" style={{ color: 'var(--ft-text-secondary)' }}>{enrollCount}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full font-semibold border" style={cls.is_active ? {
                            backgroundColor: 'var(--ft-badge-active-bg)',
                            borderColor: 'var(--ft-badge-active-border)',
                            color: 'var(--ft-badge-active-text)',
                          } : {
                            backgroundColor: 'var(--ft-badge-inactive-bg)',
                            borderColor: 'var(--ft-badge-inactive-border)',
                            color: 'var(--ft-badge-inactive-text)',
                          }}>
                            {cls.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--ft-text-muted)' }}>
                No classes found.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="pb-3 border-b" style={{ borderColor: 'var(--ft-border)' }}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--ft-text-primary)' }}>Quick Actions</h2>
          </div>
          <div className="rounded-xl border p-4 space-y-2" style={{ backgroundColor: 'var(--ft-bg-elevated)', borderColor: 'var(--ft-border)' }}>
            {[
              { href: '/dashboard/students', label: 'Add Student' },
              { href: '/dashboard/teachers', label: 'Add Teacher' },
              { href: '/dashboard/classes', label: 'Create Class' },
              { href: '/dashboard/locations', label: 'Add Location' },
              { href: '/dashboard/nfc-tags', label: 'Register NFC Tag' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between p-3 rounded-lg border transition-all group hover:border-[var(--ft-accent-border)] hover:bg-[var(--ft-accent-muted)] hover:text-[var(--ft-accent)]"
                style={{
                  backgroundColor: 'var(--ft-bg)',
                  borderColor: 'var(--ft-border)',
                  color: 'var(--ft-text-secondary)',
                }}
              >
                <span className="text-sm font-medium">{label}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border p-6 flex flex-col gap-4 transition-all hover:shadow-md hover:border-[var(--ft-text-disabled)]"
      style={{
        backgroundColor: 'var(--ft-bg-elevated)',
        borderColor: 'var(--ft-border)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: 'var(--ft-bg-surface)', color: 'var(--ft-accent)' }}
        >
          {icon}
        </div>
        <h3
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--ft-text-muted)' }}
        >
          {label}
        </h3>
      </div>
      <div className="text-4xl font-semibold tracking-tight" style={{ color: 'var(--ft-text-primary)' }}>
        {value}
      </div>
    </div>
  )
}
