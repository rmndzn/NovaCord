import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ChatProvider } from './context/ChatContext.jsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(18,15,32,0.95)',
                color: '#f0eaff',
                border: '1px solid rgba(139,92,246,0.3)',
                backdropFilter: 'blur(20px)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#a78bfa', secondary: '#05040a' } },
              error:   { iconTheme: { primary: '#f87171', secondary: '#05040a' } },
            }}
          />
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
