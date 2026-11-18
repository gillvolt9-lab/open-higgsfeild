import { useState, useRef, useEffect } from 'react'
import './App.css'

const MODELS = [
  { id: 'openrouter/gpt-6-luna', label: 'GPT-6 Luna', group: 'GPT Work' },
  { id: 'openrouter/gpt-5', label: 'GPT-5', group: 'GPT Work' },
  { id: 'openrouter/gpt-4o', label: 'GPT-4o', group: 'GPT Work' },
  { id: 'codex-1', label: 'Codex-1', group: 'Codex' },
  { id: 'codex-mini', label: 'Codex Mini', group: 'Codex' },
]

const NAV = [
  { key: 'create', label: 'Create', icon: '⬡' },
  { key: 'assets', label: 'Assets', icon: '☷' },
  { key: 'community', label: 'Community', icon: '⬭' },
  { key: 'studio', label: 'Studio', icon: '⬬' },
]

const TABS = [
  { id: 'video', label: 'Video' },
  { id: 'image', label: 'Image' },
  { id: 'character', label: 'Character' },
]

const FEATURES = [
  { title: 'Seedance', subtitle: 'Video generation model', tag: 'VIDEO' },
  { title: 'Genjutsu', subtitle: 'Image generation model', tag: 'IMAGE' },
  { title: 'Claude Fable 5.2', subtitle: 'MCP text model', tag: 'MCP' },
  { title: 'AI Influencer', subtitle: 'Character generation', tag: 'CHARACTER' },
]

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState(MODELS[0].id)
  const [mcpStatus, setMcpStatus] = useState('online')
  const [activeNav, setActiveNav] = useState('create')
  const [activeTab, setActiveTab] = useState('video')
  const inputRef = useRef(null)

  useEffect(() => {
    fetch('http://127.0.0.1:8083/v1/models', { method: 'GET', mode: 'no-cors' })
      .then(() => setMcpStatus('online'))
      .catch(() => setMcpStatus('offline'))
  }, [])

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!prompt.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('http://127.0.0.1:8083/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, max_tokens: 512 }),
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app" id="app">
      <div className="scanlines" />
      <div className="vignette" />

      <nav className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">▲</div>
          <div className="brand-text">OPEN <span className="brand-accent">HIGGSFEILD</span></div>
        </div>
        <div className="sidebar-nav">
          {NAV.map((n) => (
            <button
              key={n.key}
              className={`nav-item ${activeNav === n.key ? 'active' : ''}`}
              onClick={() => setActiveNav(n.key)}
              aria-pressed={activeNav === n.key}
            >
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-label">{n.label}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-spacer" />
        <div className="sidebar-footer">
          <div className="mcp-chip">
            <span className={`dot ${mcpStatus}`}></span>
            <span className="mcp-label">MCP {mcpStatus}</span>
          </div>
          <div className="plan">Pro Plan</div>
          <div className="credits">1,240 credits</div>
        </div>
      </nav>

      <main className="main">
        <header className="app-header">
          <div className="header-left">
            <h1 className="page-title">{activeNav === 'create' ? 'Generate' : activeNav.charAt(0).toUpperCase() + activeNav.slice(1)}</h1>
            <p className="page-sub">Create with {model.split('/').pop()}</p>
          </div>
          <div className="header-right">
            <button className="btn-icon" title="Settings">⚙</button>
            <button className="btn-profile">P</button>
          </div>
        </header>

        <div className="toolbar">
          <div className="tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="model-picker">
            <span className="picker-label">model</span>
            <select className="picker-select" value={model} onChange={(e) => setModel(e.target.value)}>
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="canvas">
          <aside className="canvas-sidebar">
            {activeNav === 'create' && (
              <>
                <div className="features">
                  <div className="section-title">Models</div>
                  <div className="feature-grid">
                    {FEATURES.map((f) => (
                      <div className="feature-card" key={f.title}>
                        <div className="feature-tag">{f.tag}</div>
                        <div className="feature-title">{f.title}</div>
                        <div className="feature-sub">{f.subtitle}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="panel">
                  <div className="panel-title">Prompt</div>
                  <form className="gen-form" onSubmit={handleGenerate}>
                    <textarea
                      ref={inputRef}
                      className="prompt-input"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe what you want to create…"
                      rows={4}
                      disabled={loading}
                    />
                    <button className="btn-generate" type="submit" disabled={loading}>
                      {loading ? 'Generating…' : 'Generate'}
                    </button>
                  </form>
                </div>
              </>
            )}

            {result && (
              <div className="panel result-panel">
                <div className="panel-title">Output</div>
                <div className="result-body">
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
              </div>
            )}
          </aside>

          <section className="canvas-main">
            {activeNav === 'create' && !result ? (
              <div className="empty-state">
                <div className="empty-icon">▭</div>
                <div className="empty-title">Ready to generate</div>
                <div className="empty-desc">Enter a prompt and click Generate to create.</div>
              </div>
            ) : result ? (
              <div className="preview-card">
                <div className="preview-header">
                  <span className="preview-tag">output</span>
                  <span className="preview-model">{model}</span>
                </div>
                <div className="preview-body">
                  <pre className="preview-json">{JSON.stringify(result, null, 2)}</pre>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </main>

      <footer className="footer">
        <span>Open Higgsfeild · MCP enabled</span>
        <span>claude.ai · chatgpt</span>
      </footer>
    </div>
  )
}
