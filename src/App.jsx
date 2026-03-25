import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import PrivateRoute from './components/layout/PrivateRoute'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Discover from './pages/Discover'
import Chats from './pages/Chats'
import ChatArea from './components/chat/ChatArea'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import CreateCommunity from './pages/CreateCommunity'

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/app" element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }>
            <Route index element={<Discover />} />
            <Route path="chats" element={<Chats />} />
            <Route path="discover" element={<Discover />} />
            <Route path="chat/:communityId" element={<ChatArea />} />
            <Route path="profile/:username" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="create-community" element={<CreateCommunity />} />
          </Route>

          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </ChatProvider>
    </AuthProvider>
  )
}
