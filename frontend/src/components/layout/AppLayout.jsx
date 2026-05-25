/**
 * Main application shell: Sidebar + Header + scrollable content area.
 */
import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { predictionsAPI } from '../../api/predictions'

export default function AppLayout() {
  const [collapsed, setCollapsed]     = useState(false)
  const [modelReady, setModelReady]   = useState(false)

  // Poll model status on mount
  useEffect(() => {
    predictionsAPI.modelStatus()
      .then(data => setModelReady(data.ready))
      .catch(() => setModelReady(false))
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header modelReady={modelReady} />
        <main style={{
          flex: 1, overflowY: 'auto', padding: '1.5rem',
          background: 'var(--color-bg-base)',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
