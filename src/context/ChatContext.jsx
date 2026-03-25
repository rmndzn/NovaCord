import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const { user, profile } = useAuth()
  const [communities, setCommunities]         = useState([])
  const [activeCommunity, setActiveCommunity] = useState(null)
  const [messages, setMessages]               = useState([])
  const [members, setMembers]                 = useState([])
  const [loading, setLoading]                 = useState(false)
  const [typingUsers, setTypingUsers]         = useState([])

  // One Supabase Realtime channel per active community
  const channelRef      = useRef(null)
  // Debounce timer for clearing typing state
  const typingTimerRef  = useRef(null)
  // Track whether we've already sent isTyping:true this burst
  const isTypingRef     = useRef(false)

  // ── Load joined communities ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    loadCommunities()
  }, [user])

  // ── Switch channel when active community changes ──────────────────────────
  useEffect(() => {
    if (!activeCommunity) return

    loadMessages(activeCommunity.id)
    loadMembers(activeCommunity.id)

    // Tear down any previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    // Build a single channel that handles:
    //   1. postgres_changes  → new messages persisted to DB
    //   2. broadcast         → ephemeral typing events (not stored in DB)
    const channel = supabase
      .channel(`community:${activeCommunity.id}`, {
        config: { broadcast: { self: false } }, // don't echo our own broadcasts back
      })

      // ── 1. New messages ────────────────────────────────────────────────────
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `community_id=eq.${activeCommunity.id}`,
        },
        async (payload) => {
          // Hydrate sender profile so MessageBubble can render name/avatar
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url')
            .eq('id', payload.new.sender_id)
            .single()

          setMessages(prev => [
            ...prev,
            { ...payload.new, profiles: senderProfile ?? null },
          ])
        }
      )

      // ── 2. Typing indicators (broadcast, ephemeral) ────────────────────────
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        // Ignore events from ourselves
        if (payload.userId === user?.id) return

        const username = payload.username || 'Someone'

        if (payload.isTyping) {
          setTypingUsers(prev =>
            prev.includes(username) ? prev : [...prev, username]
          )
        } else {
          setTypingUsers(prev => prev.filter(u => u !== username))
        }
      })

      .subscribe()

    channelRef.current = channel

    // Cleanup when community changes or component unmounts
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      // Clear stale typing state when leaving a community
      setTypingUsers([])
      isTypingRef.current = false
      clearTimeout(typingTimerRef.current)
    }
  }, [activeCommunity?.id])

  // ── Data loaders ──────────────────────────────────────────────────────────
  async function loadCommunities() {
    if (!user) return
    const { data } = await supabase
      .from('community_members')
      .select('community_id, role, communities(*)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })
    if (data) setCommunities(data.map(d => ({ ...d.communities, role: d.role })))
  }

  async function loadMessages(communityId) {
    setLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(id, display_name, username, avatar_url)')
      .eq('community_id', communityId)
      .order('created_at', { ascending: true })
      .limit(100)
    if (data) setMessages(data)
    setLoading(false)
  }

  async function loadMembers(communityId) {
    const { data } = await supabase
      .from('community_members')
      .select('*, profiles(id, display_name, username, avatar_url)')
      .eq('community_id', communityId)
    if (data) setMembers(data)
  }

  // ── Typing broadcast ──────────────────────────────────────────────────────
  /**
   * Call this whenever the user types in the message input.
   * - Sends isTyping:true once per burst (debounced leading edge)
   * - Auto-sends isTyping:false after 3 s of silence
   */
  const broadcastTyping = useCallback(() => {
    if (!channelRef.current || !profile) return

    // Send "started typing" only on the leading edge of each burst
    if (!isTypingRef.current) {
      isTypingRef.current = true
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId:   user.id,
          username: profile.display_name || profile.username,
          isTyping: true,
        },
      })
    }

    // Reset the silence timer on every keystroke
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false
      channelRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId:   user.id,
          username: profile.display_name || profile.username,
          isTyping: false,
        },
      })
    }, 3000)
  }, [user?.id, profile])

  /**
   * Call this when the user finishes sending so the indicator clears immediately.
   */
  const clearTyping = useCallback(() => {
    clearTimeout(typingTimerRef.current)
    if (!isTypingRef.current || !channelRef.current || !profile) return
    isTypingRef.current = false
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId:   user.id,
        username: profile.display_name || profile.username,
        isTyping: false,
      },
    })
  }, [user?.id, profile])

  // ── Message send ──────────────────────────────────────────────────────────
  async function sendMessage(communityId, content, fileUrl = null, messageType = 'text') {
    if (!user) return
    clearTyping() // stop typing indicator the moment we send
    const { error } = await supabase.from('messages').insert({
      community_id: communityId,
      sender_id:    user.id,
      content,
      file_url:     fileUrl,
      message_type: messageType,
    })
    if (error) throw error
  }

  // ── Media upload (Supabase Storage, 5 MB cap) ─────────────────────────────
  async function uploadMedia(file) {
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) throw new Error('File exceeds 5 MB limit')

    const ext  = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('media')
      .upload(path, file, { contentType: file.type })
    if (error) throw error

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
    return publicUrl
  }

  // ── Community helpers ─────────────────────────────────────────────────────
  async function joinCommunity(communityId) {
    if (!user) return
    const { error } = await supabase.from('community_members').insert({
      community_id: communityId,
      user_id:      user.id,
      role:         'member',
    })
    if (error) throw error
    await loadCommunities()
  }

  async function createCommunity(payload) {
    if (!user) return
    const { data, error } = await supabase
      .from('communities')
      .insert({ ...payload, owner_id: user.id })
      .select()
      .single()
    if (error) throw error
    const { error: memberError } = await supabase.from('community_members').insert({
      community_id: data.id,
      user_id:      user.id,
      role:         'owner',
    })
    if (memberError) throw memberError
    await loadCommunities()
    setActiveCommunity(data)
    return data
  }

  return (
    <ChatContext.Provider value={{
      communities, activeCommunity, setActiveCommunity,
      messages, members, loading, typingUsers,
      loadCommunities, sendMessage, uploadMedia,
      joinCommunity, createCommunity,
      broadcastTyping, clearTyping,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
