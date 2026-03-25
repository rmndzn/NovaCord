import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
})

export const MAX_FILE_SIZE = 5 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg','image/png','image/webp','image/gif','image/jpg']
export const ACCEPTED_VIDEO_TYPES = ['video/mp4','video/webm','video/quicktime']
export const ACCEPTED_FILE_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES]

export async function uploadFile(bucket, path, file) {
  if (file.size > MAX_FILE_SIZE) throw new Error(`File too large. Max 5 MB. Your file: ${(file.size/1024/1024).toFixed(1)} MB.`)
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) throw new Error(`File type not supported: ${file.type}`)
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl:'3600', upsert:true })
  if (error) throw error
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return urlData.publicUrl
}

export function getInitials(name = '') {
  return name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
}
