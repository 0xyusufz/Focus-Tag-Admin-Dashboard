'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function searchUnassignedUsers(searchTerm: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('search_unassigned_users', {
    search_email: searchTerm,
  })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function assignUserToInstitution(targetUserId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('assign_user_to_institution', {
    target_user_id: targetUserId,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/students')
  return { success: true, error: null }
}
