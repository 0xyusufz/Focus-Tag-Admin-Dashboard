import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function UnauthorizedPage() {
  const logout = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
      <p className="text-lg mb-8 max-w-md">
        You do not have administrative access to this dashboard. Please contact your system administrator if you believe this is an error.
      </p>
      <form action={logout}>
        <button className="bg-black text-white rounded-md px-6 py-2">
          Sign Out
        </button>
      </form>
    </div>
  )
}
