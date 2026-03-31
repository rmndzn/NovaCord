# ⚡ NovaCord

> Next-gen gaming social communication platform — Discord profile system meets Telegram chat layout, wrapped in a premium black + violet glassmorphism theme.

---

## 📡 Real-Time Architecture

All real-time features run through a **single Supabase Realtime channel per community** (`community:{id}`).

| Feature | Mechanism | Notes |
|---|---|---|
| New messages | `postgres_changes` → INSERT | Persisted in DB, delivered to all subscribers |
| Typing indicators | `broadcast` | Ephemeral, never touches the DB |
| Member joins | `postgres_changes` → INSERT | Optional, for live member count |

### How typing indicators work

1. User starts typing → `broadcastTyping()` sends `{ isTyping: true }` once (leading edge)
2. Each keystroke resets a 3-second silence timer
3. After 3 s of no keystrokes → auto-sends `{ isTyping: false }`
4. Sending a message → immediately sends `{ isTyping: false }` via `clearTyping()`
5. All recipients update `typingUsers[]` state — rendered as the animated dots indicator

---
