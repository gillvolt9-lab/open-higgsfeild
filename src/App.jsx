import { useState } from 'react'
import './App.css'

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!prompt.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('http://127.0.0.1:8083/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openrouter/gpt-6-luna',
          prompt,
          max_tokens: 512,
        }),
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
    <div className="app">
      <header className="header">
        <div className="logo">OPEN <span className="accent">HIGGSFEILD</span></div>
        <div className="tagline">Green & Black AI Studio</div>
      </header>

      <main className="container">
        <form className="generator" onSubmit={handleGenerate}>
          <label className="label">Prompt</label>
          <textarea
            className="input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to create..."
            rows={4}
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </form>

        {result && (
          <div className="output-card">
            <div className="output-header">Result</div>
            <pre className="output">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        <div className="mcp-info">
          <h3>MCP Integration</h3>
          <p>
            This app exposes an MCP server at <code>mcp-server.js</code>. Add it to Claude Desktop via
            <code>.mcp.json</code>, or connect ChatGPT to the HTTP SSE endpoint at
            <code>http://127.0.0.1:8083/mcp</code>.
          </p>
        </div>
      </main>

      <footer className="footer">
        Open Higgsfeild &bull; Green & Black Theme &bull; MCP-enabled
      </footer>
    </div>
  )
}
