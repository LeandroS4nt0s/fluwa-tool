import { useEffect, useState } from 'react'

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

interface EditingRouteInfo {
  scenarioId: string
  routeIdx: number
}

interface ScenariosTabProps {
  editingRoute?: EditingRouteInfo | null
  setEditingRoute?: (route: EditingRouteInfo | null) => void
}

export default function ScenariosTab({
  editingRoute: initialEditingRoute = null,
  setEditingRoute: setInitialEditingRoute = () => {}
}: ScenariosTabProps = {}) {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', routes: [] as Route[] })
  const [newRoute, setNewRoute] = useState({ method: 'GET', url: '', status: 200, response: '{}', delay: 0 })
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null)
  const [editingRouteIdx, setEditingRouteIdx] = useState<number | null>(null)
  const [editingRoute, setEditingRoute] = useState<Route | null>(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    fetchScenarios()
  }, [])

  useEffect(() => {
    if (initialEditingRoute) {
      const scenario = scenarios.find(s => s.id === initialEditingRoute.scenarioId)
      if (scenario && scenario.routes[initialEditingRoute.routeIdx]) {
        handleStartEditRoute(
          initialEditingRoute.scenarioId,
          initialEditingRoute.routeIdx,
          scenario.routes[initialEditingRoute.routeIdx]
        )
        setInitialEditingRoute(null)
      }
    }
  }, [initialEditingRoute, scenarios])

  const fetchScenarios = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5555/api/scenarios')
      const data = await res.json()
      setScenarios(data.data || [])
    } catch (error) {
      console.error('Failed to fetch scenarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImportScenario = async (file: File) => {
    if (!file) return

    try {
      setImporting(true)
      const text = await file.text()
      const scenario = JSON.parse(text)

      const res = await fetch('http://localhost:5555/api/scenarios/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      })

      if (res.ok) {
        const imported = await res.json()
        setNotification({ type: 'success', message: `✅ Cenário "${imported.name}" importado!` })
        fetchScenarios()
        setTimeout(() => setNotification(null), 3000)
      } else {
        throw new Error('Failed to import scenario')
      }
    } catch (error) {
      console.error('Error importing scenario:', error)
      setNotification({ type: 'error', message: '❌ Erro ao importar cenário' })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setImporting(false)
    }
  }

  const handleExportScenario = async (scenario: Scenario) => {
    try {
      const res = await fetch(`http://localhost:5555/api/scenarios/${scenario.id}/export`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${scenario.name}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setNotification({ type: 'success', message: '✅ Cenário exportado!' })
        setTimeout(() => setNotification(null), 2000)
      }
    } catch (error) {
      console.error('Error exporting scenario:', error)
      setNotification({ type: 'error', message: '❌ Erro ao exportar cenário' })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleAddRoute = () => {
    if (!newRoute.url.trim()) return
    try {
      const response = typeof newRoute.response === 'string' ? JSON.parse(newRoute.response) : newRoute.response
      setFormData({
        ...formData,
        routes: [
          ...formData.routes,
          {
            method: newRoute.method,
            url: newRoute.url,
            status: newRoute.status,
            response,
            delay: newRoute.delay || 0,
          }
        ]
      })
      setNewRoute({ method: 'GET', url: '', status: 200, response: '{}', delay: 0 })
    } catch (error) {
      console.error('Invalid JSON response:', error)
    }
  }

  const handleRemoveRoute = (index: number) => {
    setFormData({
      ...formData,
      routes: formData.routes.filter((_, i) => i !== index)
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      const res = await fetch('http://localhost:5555/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setFormData({ name: '', description: '', routes: [] })
        setShowForm(false)
        fetchScenarios()
      }
    } catch (error) {
      console.error('Failed to create scenario:', error)
    }
  }

  const handleActivate = async (id: string) => {
    // Validação
    if (!id || !id.trim()) {
      setNotification({ type: 'error', message: '❌ Cenário inválido' })
      return
    }

    setActivatingId(id)
    try {
      const res = await fetch(`http://localhost:5555/api/scenarios/${id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || `HTTP ${res.status}`)
      }

      // Aguardar um pouco para a API processar antes de atualizar
      await new Promise(resolve => setTimeout(resolve, 300))

      setNotification({ type: 'success', message: '✅ Cenário ativado!' })
      await fetchScenarios()

      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error('Error activating scenario:', errorMessage)
      setNotification({ type: 'error', message: `❌ Erro: ${errorMessage}` })
      setTimeout(() => setNotification(null), 5000)
    } finally {
      setActivatingId(null)
    }
  }

  const handleDeactivate = async () => {
    setActivatingId('deactivating')
    try {
      const res = await fetch(`http://localhost:5555/api/scenarios/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || `HTTP ${res.status}`)
      }

      // Aguardar um pouco para a API processar antes de atualizar
      await new Promise(resolve => setTimeout(resolve, 300))

      setNotification({ type: 'success', message: '✅ Cenário desativado!' })
      await fetchScenarios()

      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error('Error deactivating scenario:', errorMessage)
      setNotification({ type: 'error', message: `❌ Erro: ${errorMessage}` })
      setTimeout(() => setNotification(null), 5000)
    } finally {
      setActivatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this scenario?')) return
    try {
      await fetch(`http://localhost:5555/api/scenarios/${id}`, {
        method: 'DELETE',
      })
      fetchScenarios()
    } catch (error) {
      console.error('Failed to delete scenario:', error)
    }
  }

  const handleStartEditRoute = (scenarioId: string, routeIdx: number, route: Route) => {
    setEditingScenarioId(scenarioId)
    setEditingRouteIdx(routeIdx)
    setEditingRoute({ ...route })
  }

  const handleSaveEditRoute = async () => {
    if (!editingScenarioId || editingRouteIdx === null || !editingRoute) return
    const scenario = scenarios.find(s => s.id === editingScenarioId)
    if (!scenario) return

    const updatedRoutes = [...scenario.routes]
    updatedRoutes[editingRouteIdx] = editingRoute

    try {
      const res = await fetch(`http://localhost:5555/api/scenarios/${editingScenarioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scenario,
          routes: updatedRoutes
        })
      })
      if (res.ok) {
        setEditingScenarioId(null)
        setEditingRouteIdx(null)
        setEditingRoute(null)
        fetchScenarios()
        setNotification({ type: 'success', message: '✅ Route updated!' })
        setTimeout(() => setNotification(null), 3000)
      }
    } catch (error) {
      console.error('Error saving route:', error)
      setNotification({ type: 'error', message: '❌ Error updating route' })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleCancelEditRoute = () => {
    setEditingScenarioId(null)
    setEditingRouteIdx(null)
    setEditingRoute(null)
  }

  const getMethodBadge = (method: string) => {
    const badges: Record<string, string> = {
      GET: 'badge-method-get',
      POST: 'badge-method-post',
      PUT: 'badge-method-put',
      DELETE: 'badge-method-delete',
    }
    return badges[method] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="h-full overflow-y-auto p-6 bg-slate-950">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg text-sm font-bold z-50 animate-pulse ${
          notification.type === 'success'
            ? 'bg-green-500/20 text-green-300 border border-green-500/40'
            : 'bg-red-500/20 text-red-300 border border-red-500/40'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-100">Mock Scenarios</h2>
            <p className="text-sm text-slate-400 mt-1">Create and manage API response mocks for testing</p>
          </div>
          {!showForm && (
            <div className="flex gap-3">
              <button
                onClick={() => document.getElementById('scenario-import')?.click()}
                disabled={importing}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? '⏳ Importing...' : '📥 Import Scenario'}
              </button>
              <input
                id="scenario-import"
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImportScenario(file)
                }}
                className="hidden"
                disabled={importing}
              />
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                ✨ New Scenario
              </button>
            </div>
          )}
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="card p-6 bg-slate-900/50 border-slate-700/50">
            <h3 className="font-bold text-lg text-slate-100 mb-4">Create New Scenario</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">📝 Scenario Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Success Response"
                  className="w-full px-3 py-2 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">📄 Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description..."
                  className="w-full px-3 py-2 text-sm"
                  rows={2}
                />
              </div>

              {/* Routes Section */}
              <div className="pt-4 border-t border-slate-700/30">
                <h4 className="font-bold text-sm text-slate-200 mb-3">🛣️ Mock Routes</h4>

                {/* Add Route Form */}
                <div className="bg-slate-800/30 p-4 rounded-lg mb-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Method</label>
                      <select
                        value={newRoute.method}
                        onChange={(e) => setNewRoute({ ...newRoute, method: e.target.value })}
                        className="w-full px-2 py-1 text-sm"
                      >
                        <option>GET</option>
                        <option>POST</option>
                        <option>PUT</option>
                        <option>PATCH</option>
                        <option>DELETE</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-400 mb-1">URL Pattern</label>
                      <input
                        type="text"
                        value={newRoute.url}
                        onChange={(e) => setNewRoute({ ...newRoute, url: e.target.value })}
                        placeholder="/api/users/:id"
                        className="w-full px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Status Code</label>
                      <input
                        type="number"
                        value={newRoute.status}
                        onChange={(e) => setNewRoute({ ...newRoute, status: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 text-sm"
                        min="200"
                        max="599"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Delay (ms)</label>
                      <input
                        type="number"
                        value={newRoute.delay || 0}
                        onChange={(e) => setNewRoute({ ...newRoute, delay: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 text-sm"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">JSON Response</label>
                    <textarea
                      value={newRoute.response}
                      onChange={(e) => setNewRoute({ ...newRoute, response: e.target.value })}
                      placeholder='{"status": "success"}'
                      className="w-full px-2 py-1 text-sm font-mono"
                      rows={2}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRoute}
                    className="btn btn-secondary text-sm"
                  >
                    + Add Route
                  </button>
                </div>

                {/* Routes List */}
                {formData.routes.length > 0 && (
                  <div className="space-y-2">
                    {formData.routes.map((route, idx) => (
                      <div key={idx} className="bg-slate-800/40 p-3 rounded flex items-center gap-2 text-xs border border-slate-700/30">
                        <span className="px-2 py-1 rounded font-bold bg-blue-500/20 text-blue-300">
                          {route.method}
                        </span>
                        <span className="text-slate-300 font-mono flex-1 truncate">{route.url}</span>
                        <span className="text-slate-400 font-bold">→ {route.status}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRoute(idx)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Scenarios List */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">⏳ Loading scenarios...</div>
        ) : scenarios.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🎭</p>
            <p className="text-slate-400 font-medium">No scenarios created yet</p>
            <p className="text-slate-500 text-sm mt-1">Create one to start mocking API responses</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {scenarios.map(scenario => (
              <div
                key={scenario.id}
                className={`card p-6 transition border-l-2 ${
                  scenario.active
                    ? 'bg-slate-900/60 border-l-green-500 border-slate-700/50'
                    : 'bg-slate-900/40 border-l-transparent border-slate-700/50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-slate-100">{scenario.name}</h3>
                      {scenario.active && (
                        <span className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full font-bold border border-green-500/40">
                          ✅ Active
                        </span>
                      )}
                    </div>
                    {scenario.description && (
                      <p className="text-sm text-slate-400">{scenario.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <button
                      onClick={() => handleExportScenario(scenario)}
                      className="btn btn-secondary text-sm"
                      title="Export scenario as JSON"
                    >
                      📤 Export
                    </button>
                    {scenario.active ? (
                      <button
                        onClick={handleDeactivate}
                        disabled={activatingId !== null}
                        className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {activatingId === 'deactivating' ? '⏳ Desativando...' : 'Deactivate'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(scenario.id)}
                        disabled={activatingId !== null}
                        className="btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {activatingId === scenario.id ? '⏳ Ativando...' : 'Activate'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(scenario.id)}
                      disabled={activatingId !== null}
                      className="btn btn-danger text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Routes */}
                {scenario.routes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700/30">
                    <p className="text-xs font-bold text-slate-400 mb-3 uppercase">🛣️ Routes ({scenario.routes.length})</p>
                    <div className="space-y-2">
                      {scenario.routes.map((route, idx) => {
                        const isEditing = editingScenarioId === scenario.id && editingRouteIdx === idx
                        return isEditing && editingRoute ? (
                          <div key={idx} className="bg-slate-800/60 p-4 rounded-md border border-blue-500/40 space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Method</label>
                                <select
                                  value={editingRoute.method}
                                  onChange={(e) => setEditingRoute({ ...editingRoute, method: e.target.value })}
                                  className="w-full px-2 py-1 text-sm bg-slate-700 text-slate-100 rounded border border-slate-600"
                                >
                                  <option>GET</option>
                                  <option>POST</option>
                                  <option>PUT</option>
                                  <option>PATCH</option>
                                  <option>DELETE</option>
                                </select>
                              </div>
                              <div className="col-span-2">
                                <label className="block text-xs text-slate-400 mb-1">URL</label>
                                <input
                                  type="text"
                                  value={editingRoute.url}
                                  onChange={(e) => setEditingRoute({ ...editingRoute, url: e.target.value })}
                                  className="w-full px-2 py-1 text-sm bg-slate-700 text-slate-100 rounded border border-slate-600"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Status</label>
                                <input
                                  type="number"
                                  value={editingRoute.status}
                                  onChange={(e) => setEditingRoute({ ...editingRoute, status: parseInt(e.target.value) })}
                                  className="w-full px-2 py-1 text-sm bg-slate-700 text-slate-100 rounded border border-slate-600"
                                  min="200"
                                  max="599"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Delay (ms)</label>
                                <input
                                  type="number"
                                  value={editingRoute.delay || 0}
                                  onChange={(e) => setEditingRoute({ ...editingRoute, delay: parseInt(e.target.value) })}
                                  className="w-full px-2 py-1 text-sm bg-slate-700 text-slate-100 rounded border border-slate-600"
                                  min="0"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">JSON Response</label>
                              <textarea
                                value={typeof editingRoute.response === 'string' ? editingRoute.response : JSON.stringify(editingRoute.response, null, 2)}
                                onChange={(e) => {
                                  try {
                                    setEditingRoute({ ...editingRoute, response: JSON.parse(e.target.value) })
                                  } catch {
                                    setEditingRoute({ ...editingRoute, response: e.target.value })
                                  }
                                }}
                                className="w-full px-2 py-1 text-sm bg-slate-700 text-slate-100 rounded border border-slate-600 font-mono"
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-2 pt-2">
                              <button
                                type="button"
                                onClick={handleSaveEditRoute}
                                className="btn btn-primary text-sm"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditRoute}
                                className="btn btn-secondary text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div key={idx} className="bg-slate-800/40 p-3 rounded-md flex items-center gap-3 text-xs border border-slate-700/30 group">
                            <span className={`px-2 py-1 rounded font-bold ${getMethodBadge(route.method)}`}>
                              {route.method}
                            </span>
                            <span className="text-slate-300 font-mono flex-1 truncate">{route.url}</span>
                            <span className="text-slate-400 font-bold ml-auto">→ {route.status}</span>
                            <button
                              type="button"
                              onClick={() => handleStartEditRoute(scenario.id, idx, route)}
                              className="text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedRoutes = scenario.routes.filter((_, i) => i !== idx)
                                fetch(`http://localhost:5555/api/scenarios/${scenario.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ ...scenario, routes: updatedRoutes })
                                }).then(() => {
                                  fetchScenarios()
                                  setNotification({ type: 'success', message: '✅ Route deleted!' })
                                  setTimeout(() => setNotification(null), 3000)
                                }).catch(error => {
                                  console.error('Error deleting route:', error)
                                  setNotification({ type: 'error', message: '❌ Error deleting route' })
                                  setTimeout(() => setNotification(null), 3000)
                                })
                              }}
                              className="text-red-400 hover:text-red-300"
                            >
                              ✕
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-500 mt-4 font-medium">
                  Created {new Date(scenario.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
