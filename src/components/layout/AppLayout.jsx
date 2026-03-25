import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../sidebar/Sidebar'
import './AppLayout.css'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="app-layout">
      <div className="app-bg" />
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
