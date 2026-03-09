import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import NetworkTab from './features/network/NetworkTab'
import ScenariosTab from './features/scenarios/ScenariosTab'

type Tab = 'network' | 'scenarios'

interface EditingRoute {
  scenarioId: string
  routeIdx: number
}

interface ServerStatus {
  totalConnections: number
  connectedApps: string[]
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('network')
  const [editingRoute, setEditingRoute] = useState<EditingRoute | null>(null)
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('http://localhost:5555/api/status')
        const data = await res.json()
        setServerStatus(data.data)
      } catch (error) {
        console.error('Failed to fetch server status:', error)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-slate-900/50 border-b border-slate-700/50 px-8 flex items-center justify-between shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {activeTab === 'network' && '📡'}
              {activeTab === 'scenarios' && '🎭'}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">
                {activeTab === 'network' && 'Network Inspector'}
                {activeTab === 'scenarios' && 'Mock Scenarios'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            {serverStatus?.connectedApps && serverStatus.connectedApps.length > 0 ? (
              <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="font-medium">{serverStatus.connectedApps.join(', ')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-slate-800/30 px-3 py-2 rounded-lg border border-slate-700/50">
                <span className="inline-block w-2 h-2 bg-slate-500 rounded-full"></span>
                <span className="text-slate-500">No apps connected</span>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden bg-slate-950">
          {activeTab === 'network' && (
            <NetworkTab
              setActiveTab={setActiveTab}
              setEditingRoute={setEditingRoute}
            />
          )}
          {activeTab === 'scenarios' && (
            <ScenariosTab
              editingRoute={editingRoute}
              setEditingRoute={setEditingRoute}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
