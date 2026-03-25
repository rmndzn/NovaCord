
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

export function formatMessageTime(dateStr) {
  const date = new Date(dateStr)
  if (isToday(date)) return format(date, 'HH:mm')
  if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`
  return format(date, 'MMM d, HH:mm')
}

export function formatRelativeTime(dateStr) {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function generateAvatarColor(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = hash % 360
  return `hsl(${hue}, 60%, 45%)`
}
