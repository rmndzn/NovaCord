class WebSocketService {
  constructor() {
    this.ws = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 2000
    this.currentCommunityId = null
  }

  connect(communityId) {
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL
    if (!wsUrl) {
      console.warn('No VITE_WEBSOCKET_URL set — WebSocket disabled in dev without backend.')
      return
    }

    this.currentCommunityId = communityId
    this.ws = new WebSocket(`${wsUrl}?communityId=${communityId}`)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.emit('connection', { status: 'connected' })
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.emit(data.type, data.payload)
      } catch (err) {
        console.error('WS parse error:', err)
      }
    }

    this.ws.onclose = () => {
      this.emit('connection', { status: 'disconnected' })
      this.attemptReconnect()
    }

    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err)
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return
    this.reconnectAttempts++
    setTimeout(() => {
      if (this.currentCommunityId) this.connect(this.currentCommunityId)
    }, this.reconnectDelay * this.reconnectAttempts)
  }

  send(type, payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }))
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, [])
    this.listeners.get(event).push(callback)
    return () => this.off(event, callback)
  }

  off(event, callback) {
    const listeners = this.listeners.get(event) || []
    this.listeners.set(event, listeners.filter(cb => cb !== callback))
  }

  emit(event, data) {
    const listeners = this.listeners.get(event) || []
    listeners.forEach(cb => cb(data))
  }

  disconnect() {
    this.ws?.close()
    this.ws = null
    this.currentCommunityId = null
  }
}

export const wsService = new WebSocketService()
export default wsService
