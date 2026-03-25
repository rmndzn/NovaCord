
import { supabase } from '../lib/supabase'
import { MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES, ACCEPTED_VIDEO_TYPES } from '../lib/constants'

export function validateFile(file) {
  if (file.size > MAX_FILE_SIZE) throw new Error(`File too large. Maximum size is 5MB.`)
  const allTypes = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES]
  if (!allTypes.includes(file.type)) throw new Error(`File type not supported.`)
  return true
}

export function isImage(file) {
  return ACCEPTED_IMAGE_TYPES.includes(file.type)
}

export function isVideo(file) {
  return ACCEPTED_VIDEO_TYPES.includes(file.type)
}

export async function uploadFile(file, bucket = 'media') {
  validateFile(file)
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await supabase.storage.from(bucket).upload(filename, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filename)
  return { path: data.path, url: publicUrl }
}

export async function uploadAvatar(file, userId) {
  validateFile(file)
  const ext = file.name.split('.').pop()
  const filename = `avatars/${userId}.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(filename, file, {
    cacheControl: '3600',
    upsert: true,
  })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filename)
  return publicUrl
}

export async function uploadBanner(file, userId) {
  validateFile(file)
  const ext = file.name.split('.').pop()
  const filename = `banners/${userId}.${ext}`
  const { error } = await supabase.storage.from('banners').upload(filename, file, {
    cacheControl: '3600',
    upsert: true,
  })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(filename)
  return publicUrl
}
