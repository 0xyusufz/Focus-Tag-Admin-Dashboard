'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function enrollStudent(classId: string, studentId: string) {
  const supabase = await createClient()

  const trimmedClassId = classId?.trim()
  const trimmedStudentId = studentId?.trim()

  if (!trimmedClassId || !trimmedStudentId) {
    return { success: false, error: 'Class ID and Student ID are required' }
  }

  const { error } = await supabase.rpc('enroll_student_in_class', {
    p_student_id: trimmedStudentId,
    p_class_id: trimmedClassId,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/dashboard/classes/${trimmedClassId}`)
  revalidatePath('/dashboard/classes')
  return { success: true }
}

export async function removeStudent(classId: string, studentId: string) {
  const supabase = await createClient()

  const trimmedClassId = classId?.trim()
  const trimmedStudentId = studentId?.trim()

  if (!trimmedClassId || !trimmedStudentId) {
    return { success: false, error: 'Class ID and Student ID are required' }
  }

  const { error } = await supabase.rpc('remove_student_from_class', {
    p_student_id: trimmedStudentId,
    p_class_id: trimmedClassId,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/dashboard/classes/${trimmedClassId}`)
  revalidatePath('/dashboard/classes')
  return { success: true }
}

export async function assignTeacher(classId: string, teacherId: string) {
  const supabase = await createClient()

  const trimmedClassId = classId?.trim()
  const trimmedTeacherId = teacherId?.trim()

  if (!trimmedClassId || !trimmedTeacherId) {
    return { success: false, error: 'Class ID and Teacher ID are required' }
  }

  const { error } = await supabase.rpc('assign_teacher_to_class', {
    p_teacher_id: trimmedTeacherId,
    p_class_id: trimmedClassId,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/dashboard/classes/${trimmedClassId}`)
  revalidatePath('/dashboard/classes')
  return { success: true }
}

export async function revokeTeacher(classId: string, teacherId: string) {
  const supabase = await createClient()

  const trimmedClassId = classId?.trim()
  const trimmedTeacherId = teacherId?.trim()

  if (!trimmedClassId || !trimmedTeacherId) {
    return { success: false, error: 'Class ID and Teacher ID are required' }
  }

  const { error } = await supabase.rpc('revoke_teacher_from_class', {
    p_teacher_id: trimmedTeacherId,
    p_class_id: trimmedClassId,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/dashboard/classes/${trimmedClassId}`)
  revalidatePath('/dashboard/classes')
  return { success: true }
}
