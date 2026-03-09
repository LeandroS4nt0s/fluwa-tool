import { useState, useEffect } from 'react'

interface SidebarProps {
  activeTab: 'network' | 'scenarios'
  setActiveTab: (tab: 'network' | 'scenarios') => void
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch('http://localhost:5555/health')
        setConnected(res.ok)
      } catch {
        setConnected(false)
      }
    }
    checkConnection()
    const interval = setInterval(checkConnection, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <aside className="w-64 bg-slate-900/50 border-r border-slate-700/50 flex flex-col backdrop-blur-sm">
      {/* Logo */}
      <div className="h-16 px-6 flex items-center border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">⚡</span>
          <div>
            <p className="font-bold text-slate-100">Fluwa</p>
            <p className="text-xs text-slate-400">DevTools</p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="px-4 py-4 border-b border-slate-700/50">
        <div className="card p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
            <span className="text-xs font-medium text-slate-300">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono">localhost:5555</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {[
          { id: 'network', label: 'Network', icon: '📡' },
          { id: 'scenarios', label: 'Scenarios', icon: '🎭' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as 'network' | 'scenarios')}
            className={`w-full text-left px-4 py-2 rounded-md font-medium text-sm transition ${
              activeTab === item.id
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <span className="mr-2">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50 text-xs text-slate-500 space-y-2">
        <p className="font-medium text-slate-400">Network interceptor</p>
        <p>Mock server & DevTools</p>
      </div>
    </aside>
  )
}
