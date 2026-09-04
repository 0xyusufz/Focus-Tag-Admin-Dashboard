'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createClass(formData: FormData) {
  const name = String(formData.get('name') || '').trim()
  const locationId = String(formData.get('location_id') || '').trim()

  if (!name || name.length > 100) {
    return { success: false, error: 'Name must be between 1 and 100 characters.' }
  }

  if (!locationId) {
    return { success: false, error: 'Location must be selected.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc('create_class', {
    p_name: name,
    p_location_id: locationId,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/classes')
  return { success: true, error: null }
}

export async function updateClassStatus(classId: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('update_class_status', {
    p_class_id: classId,
    p_is_active: isActive,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/classes')
  return { success: true, error: null }
}
