'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function promoteStudentToTeacher(targetUserId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('promote_student_to_teacher', {
    target_user_id: targetUserId,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/teachers')
  revalidatePath('/dashboard/students')
  return { success: true, error: null }
}
