import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { logout } from './actions'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch the user's canonical profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, role, institution_id')
    .eq('id', user.id)
    .single()

  // 3. Backend-authoritative admin authorization
  if (!profile || profile.role !== 'admin' || !profile.institution_id) {
    redirect('/unauthorized')
  }

  // 4. Fetch the institution context
  const { data: institution } = await supabase
    .from('institutions')
    .select('name')
    .eq('id', profile.institution_id)
    .single()

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold tracking-tight">FocusTag</h2>
          <p className="text-sm text-gray-500">Admin Dashboard</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="block px-4 py-2 text-sm rounded hover:bg-gray-100">
            Dashboard
          </Link>
          <Link href="/dashboard/students" className="block px-4 py-2 text-sm rounded hover:bg-gray-100">
            Students
          </Link>
          <Link href="/dashboard/teachers" className="block px-4 py-2 text-sm rounded hover:bg-gray-100">
            Teachers
          </Link>
          <div className="block px-4 py-2 text-sm text-gray-400 cursor-not-allowed">
            Classes (Coming Soon)
          </div>
          <Link href="/dashboard/locations" className="block px-4 py-2 text-sm rounded hover:bg-gray-100">
            Locations
          </Link>
          <Link href="/dashboard/nfc-tags" className="block px-4 py-2 text-sm rounded hover:bg-gray-100">
            NFC Tags
          </Link>
        </nav>
        
        <div className="p-4 border-t">
          <form action={logout}>
            <button className="w-full bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800">
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-8">
          <div className="font-semibold text-gray-700">
            {institution?.name || 'Unknown Institution'}
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-4">
            <span>{profile.name || user.email}</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              Admin
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
