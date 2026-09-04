'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function registerNfcTag(formData: FormData) {
  const uid = String(formData.get('uid') || '').trim().toUpperCase()
  const locationId = String(formData.get('location_id') || '').trim()

  // Client-side pre-validation (not the security boundary — RPC re-validates)
  if (!uid) {
    return { success: false, error: 'UID is required.' }
  }
  // Validate UID format: uppercase hex bytes separated by colons, 4–10 bytes
  if (!/^[0-9A-F]{2}(:[0-9A-F]{2}){3,9}$/.test(uid)) {
    return {
      success: false,
      error: 'Invalid UID format. Use uppercase hex bytes separated by colons (e.g. 1D:FF:7C:1C:1A:10:80).',
    }
  }
  if (!locationId) {
    return { success: false, error: 'Location is required.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc('register_nfc_tag', {
    p_uid: uid,
    p_location_id: locationId,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/nfc-tags')
  return { success: true, error: null }
}

export async function deactivateNfcTag(tagId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('deactivate_nfc_tag', {
    p_tag_id: tagId,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/nfc-tags')
  return { success: true, error: null }
}

export async function reactivateNfcTag(tagId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('reactivate_nfc_tag', {
    p_tag_id: tagId,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/nfc-tags')
  return { success: true, error: null }
}
