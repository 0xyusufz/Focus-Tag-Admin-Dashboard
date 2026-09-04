'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

// Returns a map of uid → has_sessions (boolean) for the given UIDs.
// Uses the get_tag_session_status SECURITY DEFINER RPC — admin-only,
// institution-scoped, never exposes session contents.
export async function getTagSessionStatus(
  uids: string[],
): Promise<Record<string, boolean>> {
  if (uids.length === 0) return {}
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_tag_session_status', {
    p_uids: uids,
  })

  if (error || !data) {
    // On any error, default to "has sessions" = true for all UIDs (safe default:
    // shows Location Locked instead of incorrectly enabling Change Location).
    return Object.fromEntries(uids.map((uid) => [uid, true]))
  }

  const result: Record<string, boolean> = {}
  for (const row of data as { uid: string; has_sessions: boolean }[]) {
    result[row.uid] = row.has_sessions
  }
  // Any UID not returned by the RPC is treated as locked (safe default)
  for (const uid of uids) {
    if (!(uid in result)) result[uid] = true
  }
  return result
}

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

export async function reassignNfcTag(tagId: string, newLocationId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('reassign_nfc_tag', {
    p_tag_id: tagId,
    p_new_location_id: newLocationId,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/nfc-tags')
  return { success: true, error: null }
}
