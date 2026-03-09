import { useEffect, useState, useRef } from 'react'

interface Request {
  id: string
  method: string
  url: string
  status?: number
  timestamp: string
  duration?: number
  source: string
  headers?: Record<string, string>
  body?: unknown
  response?: unknown
}

interface Route {
  method: string
  url: string
  status: number
  response: unknown
  delay?: number
  description?: string
}

interface Scenario {
  id: string
  name: string
  description?: string
  routes: Route[]
  active?: boolean
  createdAt: string
  updatedAt: string
}

interface EditingRoute {
  scenarioId: string
  routeIdx: number
}

interface NetworkTabProps {
  setActiveTab: (tab: 'network' | 'scenarios') => void
  setEditingRoute: (route: EditingRoute | null) => void
}

export default function NetworkTab({ setActiveTab, setEditingRoute }: NetworkTabProps) {
  const [requests, setRequests] = useState<Request[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [filter, setFilter] = useState('')
  const [dividerPos, setDividerPos] = useState(45)
  const [isDragging, setIsDragging] = useState(false)
  const [showMockModal, setShowMockModal] = useState(false)
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [newScenarioName, setNewScenarioName] = useState('')
  const [mockNotification, setMockNotification] = useState<string | null>(null)
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchRequests()
    fetchActiveScenario()
    const ws = new WebSocket('ws://localhost:5555/ws')
    ws.onopen = () => setConnected(true)
    ws.onmessage = () => {
      fetchRequests()
      fetchActiveScenario()
    }
    ws.onclose = () => setConnected(false)
    return () => ws.close()
  }, [])

  useEffect(() => {
    if (!isDragging) return
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newPos = ((e.clientX - rect.left) / rect.width) * 100
      if (newPos > 25 && newPos < 75) setDividerPos(newPos)
    }
    const handleMouseUp = () => setIsDragging(false)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const fetchRequests = async () => {
    try {
      const res = await fetch('http://localhost:5555/api/requests')
      const data = await res.json()
      setRequests(data.data || [])
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    }
  }

  const fetchScenarios = async () => {
    try {
      const res = await fetch('http://localhost:5555/api/scenarios')
      const data = await res.json()
      setScenarios(data.data || [])
    } catch (error) {
      console.error('Failed to fetch scenarios:', error)
    }
  }

  const fetchActiveScenario = async () => {
    try {
      const res = await fetch('http://localhost:5555/api/scenarios/active')
      const data = await res.json()
      setActiveScenario(data.data || null)
    } catch (error) {
      console.error('Failed to fetch active scenario:', error)
      setActiveScenario(null)
    }
  }

  const handleMockThis = async () => {
    if (!selectedRequest) return

    try {
      let scenarioId = selectedScenario

      // Se selecionou criar novo cenário
      if (!scenarioId && newScenarioName.trim()) {
        const createRes = await fetch('http://localhost:5555/api/scenarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newScenarioName,
            description: `Auto-created from request: ${selectedRequest.method} ${selectedRequest.url}`,
            routes: []
          })
        })
        const newScenario = await createRes.json()
        scenarioId = newScenario.id
      }

      if (!scenarioId) {
        setMockNotification('❌ Selecione ou crie um cenário')
        setTimeout(() => setMockNotification(null), 3000)
        return
      }

      // Adicionar rota ao cenário
      const updateRes = await fetch(`http://localhost:5555/api/scenarios/${scenarioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routes: [
            ...(scenarios.find(s => s.id === scenarioId)?.routes || []),
            {
              method: selectedRequest.method,
              url: selectedRequest.url,
              status: selectedRequest.status || 200,
              response: selectedRequest.response || {},
              description: `Captured from request`
            }
          ]
        })
      })

      if (updateRes.ok) {
        setMockNotification(`✅ Adicionado ao cenário!`)
        setTimeout(() => setMockNotification(null), 3000)
        setShowMockModal(false)
        setSelectedScenario(null)
        setNewScenarioName('')
        fetchScenarios()
      }
    } catch (error) {
      console.error('Error adding mock:', error)
      setMockNotification('❌ Erro ao adicionar mock')
      setTimeout(() => setMockNotification(null), 3000)
    }
  }

  const openMockModal = () => {
    fetchScenarios()
    setShowMockModal(true)
  }

  const urlMatches = (actualUrl: string, routePattern: string): boolean => {
    const actualUrlPath = actualUrl.split('?')[0].split('#')[0]

    if (routePattern === actualUrlPath) return true

    if (routePattern.endsWith('/*')) {
      const basePath = routePattern.slice(0, -2)
      return actualUrlPath.startsWith(basePath)
    }

    const actualParts = actualUrlPath.split('/').filter(Boolean)
    const patternParts = routePattern.split('/').filter(Boolean)

    if (actualParts.length !== patternParts.length) return false

    return patternParts.every((patternPart, index) => {
      const actualPart = actualParts[index]
      if (patternPart.startsWith(':')) return actualPart !== undefined
      return patternPart === actualPart
    })
  }

  const findMockedRoute = (method: string, url: string): Route | null => {
    if (!activeScenario) return null
    return activeScenario.routes.find(route =>
      route.method === method && urlMatches(url, route.url)
    ) || null
  }

  const handleClearRequests = async () => {
    if (!window.confirm('Clear all captured requests?')) return
    try {
      await fetch('http://localhost:5555/api/requests', {
        method: 'DELETE'
      })
      setRequests([])
      setSelectedId(null)
      setMockNotification('✅ Requests cleared!')
      setTimeout(() => setMockNotification(null), 2000)
    } catch (error) {
      console.error('Error clearing requests:', error)
      setMockNotification('❌ Error clearing requests')
      setTimeout(() => setMockNotification(null), 2000)
    }
  }

  const handleEditMockedRoute = () => {
    if (!activeScenario || !selectedRequest) return

    const routeIdx = activeScenario.routes.findIndex(r =>
      r.method === selectedRequest.method && urlMatches(selectedRequest.url, r.url)
    )

    if (routeIdx !== -1) {
      setEditingRoute({
        scenarioId: activeScenario.id,
        routeIdx
      })
      setActiveTab('scenarios')
    }
  }


  const selectedRequest = requests.find(r => r.id === selectedId)
  const filteredRequests = requests.filter(r =>
    r.url.toLowerCase().includes(filter.toLowerCase()) ||
    r.method.toLowerCase().includes(filter.toLowerCase())
  )

  const getMethodBadge = (method: string) => {
    const badges: Record<string, string> = {
      GET: 'badge-method-get',
      POST: 'badge-method-post',
      PUT: 'badge-method-put',
      DELETE: 'badge-method-delete',
    }
    return badges[method] || 'bg-gray-100 text-gray-700'
  }

  const getStatusBadge = (status?: number) => {
    if (!status) return 'bg-gray-100 text-gray-700'
    if (status >= 200 && status < 300) return 'badge-status-2xx'
    if (status >= 400 && status < 500) return 'badge-status-4xx'
    return 'badge-status-5xx'
  }

  return (
    <div ref={containerRef} className="flex h-full overflow-hidden bg-slate-950">
      {/* Request List */}
      <div
        style={{ width: `${dividerPos}%` }}
        className="flex flex-col border-r border-slate-700/50"
      >
        {/* Search */}
        <div className="p-4 border-b border-slate-700/50 bg-slate-900/50 space-y-3">
          <input
            type="text"
            placeholder="🔍 Filter requests..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm"
          />
          {requests.length > 0 && (
            <button
              onClick={handleClearRequests}
              className="w-full px-3 py-2 text-xs font-bold bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded border border-red-500/40 transition"
            >
              🗑️ Clear All
            </button>
          )}
        </div>

        {/* Info */}
        <div className="px-4 py-3 bg-slate-900/30 border-b border-slate-700/50 text-xs font-medium text-slate-300 flex items-center gap-2">
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
          {filteredRequests.length} requests
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto bg-slate-950">
          {filteredRequests.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              {filter ? '❌ No requests found' : '⏳ No requests yet...'}
            </div>
          ) : (
            filteredRequests.map(req => (
              <div
                key={req.id}
                onClick={() => setSelectedId(req.id)}
                className={`px-4 py-3 border-b border-slate-700/30 cursor-pointer transition ${
                  selectedId === req.id
                    ? 'bg-blue-900/30 border-l-2 border-l-blue-500'
                    : 'hover:bg-slate-900/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${getMethodBadge(req.method)}`}>
                    {req.method}
                  </span>
                  {req.status && (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusBadge(req.status)}`}>
                      {req.status}
                    </span>
                  )}
                  {req.source === 'mock' && <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded font-bold border border-yellow-500/40">MOCK</span>}
                  {req.source === 'real' && <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold border border-blue-500/40">REAL</span>}
                </div>
                <p className="text-xs text-slate-300 truncate font-mono">{req.url}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(req.timestamp).toLocaleTimeString()}
                  {req.duration && ` • ${req.duration.toFixed(0)}ms`}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Divider */}
      <div
        onMouseDown={() => setIsDragging(true)}
        className="w-1 bg-gradient-to-b from-transparent via-blue-500/50 to-transparent hover:via-blue-400 cursor-col-resize transition"
      />

      {/* Notification */}
      {mockNotification && (
        <div className="fixed top-4 right-4 px-4 py-3 rounded-lg text-sm font-bold z-50 bg-green-500/20 text-green-300 border border-green-500/40">
          {mockNotification}
        </div>
      )}

      {/* Details */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
        {selectedRequest ? (
          <>
            <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-900/50 flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase">URL</p>
                <p className="text-sm font-mono text-blue-400 break-all">{selectedRequest.url}</p>
              </div>
              {findMockedRoute(selectedRequest.method, selectedRequest.url) ? (
                <button
                  onClick={handleEditMockedRoute}
                  className="ml-4 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded transition flex-shrink-0"
                >
                  ✏️ Edit Mock
                </button>
              ) : (
                <button
                  onClick={openMockModal}
                  className="ml-4 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded transition flex-shrink-0"
                >
                  🎭 Mock This
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Metadata */}
              <div className="card p-4">
                <h3 className="text-sm font-bold text-slate-100 mb-3">📊 Metadata</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-500 mb-1">Method</p>
                    <p className="font-mono font-bold text-slate-100">{selectedRequest.method}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Status</p>
                    <p className="font-mono font-bold text-slate-100">{selectedRequest.status || '—'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Duration</p>
                    <p className="font-mono font-bold text-slate-100">{selectedRequest.duration?.toFixed(2) || '—'}ms</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Source</p>
                    <p className="font-bold text-slate-100">{selectedRequest.source.toUpperCase()}</p>
                  </div>
                </div>
              </div>

              {/* Headers */}
              {selectedRequest.headers && Object.keys(selectedRequest.headers).length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-100 mb-3">📋 Headers</h3>
                  <div className="code-block max-h-48 text-xs space-y-1">
                    {Object.entries(selectedRequest.headers || {}).map(([key, val]: [string, unknown]) => {
                      const headerValue: string = typeof val === 'string' ? val : JSON.stringify(val)
                      return (
                        <div key={key}>
                          <span className="text-blue-400 font-bold">{key}</span>
                          <span className="text-slate-600">: </span>
                          <span className="text-slate-300">{headerValue}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Response */}
              {selectedRequest.response ? (
                <div>
                  <h3 className="text-sm font-bold text-slate-100 mb-3">📤 Response</h3>
                  <pre className="code-block text-xs max-h-72 overflow-auto">
                    {JSON.stringify(selectedRequest.response, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            <p className="text-sm">Select a request to view details</p>
          </div>
        )}
      </div>

      {/* Mock Modal */}
      {showMockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg p-6 w-96 max-h-96 overflow-y-auto border border-slate-700">
            <h2 className="text-xl font-bold text-slate-100 mb-4">🎭 Add Request to Scenario</h2>

            {/* Existing Scenarios */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-300 mb-2">Selecione um cenário:</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {scenarios.length > 0 ? (
                  scenarios.map(s => (
                    <label key={s.id} className="flex items-center p-2 bg-slate-800 rounded hover:bg-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="scenario"
                        value={s.id}
                        checked={selectedScenario === s.id}
                        onChange={(e) => {
                          setSelectedScenario(e.target.value)
                          setNewScenarioName('')
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-slate-300">{s.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">Nenhum cenário criado</p>
                )}
              </div>
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-slate-700"></div>
              <span className="text-xs text-slate-500">OU</span>
              <div className="flex-1 h-px bg-slate-700"></div>
            </div>

            {/* Create New Scenario */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-300 mb-2">Criar novo cenário:</label>
              <input
                type="text"
                value={newScenarioName}
                onChange={(e) => {
                  setNewScenarioName(e.target.value)
                  setSelectedScenario(null)
                }}
                placeholder="Nome do novo cenário..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMockModal(false)
                  setSelectedScenario(null)
                  setNewScenarioName('')
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-bold rounded transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleMockThis}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded transition"
              >
                ✅ Add to Mock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
