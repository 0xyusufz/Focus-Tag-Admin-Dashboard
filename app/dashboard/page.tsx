import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 2. We can safely assume the user is authorized here because the layout checks it.
  // However, we fetch counts securely using normal RLS. The RLS policies we've written
  // (e.g. "Classes are manageable by admins" USING (get_auth_role() = 'admin' AND institution_id = get_auth_institution()))
  // will automatically scope these queries to the admin's institution.

  const [
    { count: studentsCount },
    { count: teachersCount },
    { count: classesCount },
    { count: locationsCount },
    { count: nfcTagsCount },
  ] = await Promise.all([
    // Enrollments roughly map to active students in classes.
    // Wait, let's just count profiles in our institution where role = 'student'
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('classes').select('*', { count: 'exact', head: true }),
    supabase.from('locations').select('*', { count: 'exact', head: true }),
    supabase.from('nfc_tags').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Students" value={studentsCount ?? 0} />
        <StatCard title="Total Teachers" value={teachersCount ?? 0} />
        <StatCard title="Active Classes" value={classesCount ?? 0} />
        <StatCard title="Locations" value={locationsCount ?? 0} />
        <StatCard title="Registered NFC Tags" value={nfcTagsCount ?? 0} />
      </div>

      <div className="mt-12 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4">Phase 1 Pilot Active</h2>
        <p className="text-gray-600 mb-4">
          Welcome to the FocusTag Institutional Admin Dashboard. You are viewing the live environment for the Phase 9 Pilot.
        </p>
        <p className="text-gray-600">
          CRUD functionality for Students, Teachers, Classes, Locations, and NFC Tags is currently being prepared and will be available in the next deployment phase.
        </p>
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-center">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  )
}
