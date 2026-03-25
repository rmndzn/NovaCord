
import { useState, useRef } from 'react'
import { Send, Paperclip, X, Image, Video } from 'lucide-react'
import { useChat } from '../../context/ChatContext'
import { uploadFile, validateFile, isImage, isVideo } from '../../services/uploadService'
import { formatFileSize } from '../../utils/formatters'
import toast from 'react-hot-toast'
import styles from './MessageInput.module.css'

export function MessageInput({ communityId }) {
  const { sendMessage } = useChat()
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [sending, setSending] = useState(false)
  const fileRef = useRef(null)

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      validateFile(f)
      setFile(f)
      if (isImage(f)) setPreview({ type: 'image', url: URL.createObjectURL(f), name: f.name, size: f.size })
      else if (isVideo(f)) setPreview({ type: 'video', url: URL.createObjectURL(f), name: f.name, size: f.size })
    } catch (err) {
      toast.error(err.message)
    }
    e.target.value = ''
  }

  function removeFile() {
    setFile(null)
    if (preview?.url) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  async function handleSend() {
    if (!text.trim() && !file) return
    setSending(true)
    try {
      let fileUrl = null
      let messageType = 'text'
      if (file) {
        const uploaded = await uploadFile(file)
        fileUrl = uploaded.url
        messageType = isImage(file) ? 'image' : 'video'
      }
      await sendMessage({ communityId, content: text.trim(), messageType, fileUrl })
      setText('')
      removeFile()
    } catch (err) {
      toast.error(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={styles.container}>
      {preview && (
        <div className={styles.preview}>
          <div className={styles.previewContent}>
            {preview.type === 'image' && <img src={preview.url} alt="preview" className={styles.previewImg} />}
            {preview.type === 'video' && <video src={preview.url} className={styles.previewVideo} />}
            <div className={styles.previewInfo}>
              <span className={styles.previewName}>{preview.name}</span>
              <span className={styles.previewSize}>{formatFileSize(preview.size)}</span>
            </div>
          </div>
          <button className={styles.removeBtn} onClick={removeFile}><X size={14} /></button>
        </div>
      )}
      <div className={styles.inputRow}>
        <button className={styles.attachBtn} onClick={() => fileRef.current?.click()} disabled={sending}>
          <Paperclip size={18} />
        </button>
        <input type="file" ref={fileRef} accept="image/*,video/*" onChange={handleFile} style={{ display: 'none' }} />
        <textarea
          className={styles.input}
          placeholder="Send a message..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          disabled={sending}
        />
        <button
          className={`${styles.sendBtn} ${(text.trim() || file) && !sending ? styles.active : ''}`}
          onClick={handleSend}
          disabled={(!text.trim() && !file) || sending}
        >
          {sending ? <span className={styles.spinner} /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}
