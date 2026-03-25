import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { ROLES } from '../lib/constants'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const { user, profile } = useAuth()
  const [communities, setCommunities] = useState([])
  const [activeCommunity, setActiveCommunity] = useState(null)
  const [messages, setMessages] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])

  const channelRef = useRef(null)
  const typingTimerRef = useRef(null)
  const isTypingRef = useRef(false)

  const mergeCommunity = useCallback((nextCommunity) => {
    if (!nextCommunity) return

    setCommunities((prev) => {
      const existing = prev.find((community) => community.id === nextCommunity.id)
      if (!existing) return [nextCommunity, ...prev]
      return prev.map((community) =>
        community.id === nextCommunity.id ? { ...community, ...nextCommunity } : community
      )
    })

    setActiveCommunity((prev) => (
      prev?.id === nextCommunity.id ? { ...prev, ...nextCommunity } : prev
    ))
  }, [])

  const syncActiveCommunity = useCallback((nextCommunities) => {
    setActiveCommunity((current) => {
      if (!nextCommunities.length) return null
      if (!current) return nextCommunities[0]
      return nextCommunities.find((community) => community.id === current.id) || nextCommunities[0]
    })
  }, [])

  useEffect(() => {
    if (!user) {
      setCommunities([])
      setActiveCommunity(null)
      setMessages([])
      setMembers([])
      setTypingUsers([])
      return
    }

    loadCommunities()
  }, [user?.id])

  useEffect(() => {
    if (!activeCommunity) return

    loadMessages(activeCommunity.id)
    loadMembers(activeCommunity.id)

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel(`community:${activeCommunity.id}`, {
        config: { broadcast: { self: false } },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `community_id=eq.${activeCommunity.id}`,
        },
        async (payload) => {
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url')
            .eq('id', payload.new.sender_id)
            .single()

          setMessages((prev) => [
            ...prev,
            { ...payload.new, profiles: senderProfile ?? null },
          ])
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId === user?.id) return

        const username = payload.username || 'Someone'
        if (payload.isTyping) {
          setTypingUsers((prev) => (prev.includes(username) ? prev : [...prev, username]))
        } else {
          setTypingUsers((prev) => prev.filter((entry) => entry !== username))
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setTypingUsers([])
      isTypingRef.current = false
      clearTimeout(typingTimerRef.current)
    }
  }, [activeCommunity?.id, user?.id])

  async function loadCommunities() {
    if (!user) return []

    const { data, error } = await supabase
      .from('community_members')
      .select('community_id, role, communities(*)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })

    if (error) throw error

    const nextCommunities = (data || [])
      .map((entry) => entry.communities ? { ...entry.communities, role: entry.role } : null)
      .filter(Boolean)

    setCommunities(nextCommunities)
    syncActiveCommunity(nextCommunities)
    return nextCommunities
  }

  async function activateCommunityById(communityId) {
    if (!communityId || !user) return null

    const existing = communities.find((community) => community.id === communityId)
    if (existing) {
      setActiveCommunity(existing)
      return existing
    }

    const { data, error } = await supabase
      .from('community_members')
      .select('role, communities(*)')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error
    if (!data?.communities) return null

    const nextCommunity = { ...data.communities, role: data.role }
    mergeCommunity(nextCommunity)
    setActiveCommunity(nextCommunity)
    return nextCommunity
  }

  async function loadMessages(communityId) {
    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(id, display_name, username, avatar_url)')
      .eq('community_id', communityId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) throw error
    setMessages(data || [])
    setLoading(false)
  }

  async function loadMembers(communityId) {
    const { data, error } = await supabase
      .from('community_members')
      .select('*, profiles(id, display_name, username, avatar_url, email)')
      .eq('community_id', communityId)
      .order('joined_at', { ascending: true })

    if (error) throw error
    setMembers(data || [])
    return data || []
  }

  const broadcastTyping = useCallback(() => {
    if (!channelRef.current || !profile || !user) return

    if (!isTypingRef.current) {
      isTypingRef.current = true
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: user.id,
          username: profile.display_name || profile.username,
          isTyping: true,
        },
      })
    }

    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false
      channelRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: user.id,
          username: profile.display_name || profile.username,
          isTyping: false,
        },
      })
    }, 3000)
  }, [profile, user])

  const clearTyping = useCallback(() => {
    clearTimeout(typingTimerRef.current)
    if (!isTypingRef.current || !channelRef.current || !profile || !user) return

    isTypingRef.current = false
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: user.id,
        username: profile.display_name || profile.username,
        isTyping: false,
      },
    })
  }, [profile, user])

  async function sendMessage(communityId, content, fileUrl = null, messageType = 'text') {
    if (!user) return

    clearTyping()

    const { error } = await supabase.from('messages').insert({
      community_id: communityId,
      sender_id: user.id,
      content,
      file_url: fileUrl,
      message_type: messageType,
    })

    if (error) throw error
  }

  async function uploadMedia(file) {
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) throw new Error('File exceeds 5 MB limit')

    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('media')
      .upload(path, file, { contentType: file.type })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
    return publicUrl
  }

  async function joinCommunity(communityId) {
    if (!user) return

    const { error } = await supabase.from('community_members').insert({
      community_id: communityId,
      user_id: user.id,
      role: ROLES.MEMBER,
    })

    if (error) throw error

    const nextCommunities = await loadCommunities()
    const nextActive = nextCommunities.find((community) => community.id === communityId)
    if (nextActive) setActiveCommunity(nextActive)
  }

  async function createCommunity(payload) {
    if (!user) return null

    const { data, error } = await supabase
      .from('communities')
      .insert({ ...payload, owner_id: user.id })
      .select()
      .single()

    if (error) throw error

    const { error: memberError } = await supabase.from('community_members').insert({
      community_id: data.id,
      user_id: user.id,
      role: ROLES.OWNER,
    })

    if (memberError) throw memberError

    const nextCommunity = { ...data, role: ROLES.OWNER }
    mergeCommunity(nextCommunity)
    await loadCommunities()
    setActiveCommunity(nextCommunity)
    return nextCommunity
  }

  async function updateCommunity(communityId, updates) {
    const { data, error } = await supabase
      .from('communities')
      .update(updates)
      .eq('id', communityId)
      .select()
      .single()

    if (error) throw error

    const nextCommunity = {
      ...data,
      role: activeCommunity?.id === communityId ? activeCommunity.role : communities.find((community) => community.id === communityId)?.role,
    }

    mergeCommunity(nextCommunity)
    return nextCommunity
  }

  async function findProfileByIdentifier(identifier) {
    const value = identifier.trim()
    if (!value) throw new Error('Enter a username or email.')

    let result = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, email')
      .ilike('username', value)
      .maybeSingle()

    if (result.error) throw result.error
    if (result.data) return result.data

    result = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, email')
      .ilike('email', value)
      .maybeSingle()

    if (result.error) throw result.error
    return result.data
  }

  async function addCommunityMember(communityId, identifier) {
    const targetProfile = await findProfileByIdentifier(identifier)
    if (!targetProfile) throw new Error('No user found with that username or email.')

    const { error } = await supabase.from('community_members').insert({
      community_id: communityId,
      user_id: targetProfile.id,
      role: ROLES.MEMBER,
    })

    if (error) throw error

    await loadMembers(communityId)
    return targetProfile
  }

  async function removeCommunityMember(memberId, communityId) {
    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('id', memberId)

    if (error) throw error

    const nextMembers = await loadMembers(communityId)

    if (user && nextMembers.every((member) => member.user_id !== user.id)) {
      setActiveCommunity(null)
      setMessages([])
      setTypingUsers([])
      await loadCommunities()
    }
  }

  async function deleteCommunity(communityId) {
    const { error } = await supabase
      .from('communities')
      .delete()
      .eq('id', communityId)

    if (error) throw error

    setMessages([])
    setMembers([])
    setTypingUsers([])

    const nextCommunities = await loadCommunities()
    if (!nextCommunities.some((community) => community.id === communityId)) {
      setActiveCommunity(nextCommunities[0] || null)
    }
  }

  return (
    <ChatContext.Provider
      value={{
        communities,
        activeCommunity,
        setActiveCommunity,
        activateCommunityById,
        messages,
        members,
        loading,
        typingUsers,
        loadCommunities,
        fetchCommunities: loadCommunities,
        loadMembers,
        sendMessage,
        uploadMedia,
        joinCommunity,
        createCommunity,
        updateCommunity,
        addCommunityMember,
        removeCommunityMember,
        deleteCommunity,
        broadcastTyping,
        clearTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
