#!/usr/bin/env node
// Open Higgsfeild MCP Server
// stdio mode (default) for Claude Desktop; `--http` for ChatGPT + frontend.

import { createServer } from 'node:http'
import { createInterface } from 'node:readline'
import { stdin, stdout } from 'node:process'

const PORT = 8083

const TOOLS = [
  {
    name: 'list_models',
    description: 'List available AI models.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'generate_text',
    description: 'Generate a text completion for a prompt.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'The user prompt.' },
        model: { type: 'string', description: 'Model id.', default: 'open-higgsfeild' },
      },
      required: ['prompt'],
    },
  },
]

function ok(id, result) { return { jsonrpc: '2.0', id, result } }
function err(id, code, message) { return { jsonrpc: '2.0', id, error: { code, message } } }

async function handle(req) {
  if (req.method === 'initialize') {
    return ok(req.id, {
      protocolVersion: '2025-06-12',
      capabilities: { tools: {}, resources: {} },
      serverInfo: { name: 'open-higgsfeild', version: '1.0.0' },
    })
  }
  if (req.method === 'initialized') return null // notification, no response
  if (req.method === 'tools/list') {
    return ok(req.id, { tools: TOOLS })
  }
  if (req.method === 'tools/call') {
    const { name, arguments: args = {} } = req.params
    if (name === 'list_models') {
      return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(['open-higgsfeild'], null, 2) }] })
    }
    if (name === 'generate_text') {
      const text = `Open Higgsfeild response to: "${args.prompt}"`
      return ok(req.id, { content: [{ type: 'text', text }] })
    }
    return err(req.id, -32602, `Unknown tool: ${name}`)
  }
  return err(req.id, -32601, `Method not found: ${req.method}`)
}

// ----- stdio mode (Claude Desktop via .mcp.json) -----
function runStdio() {
  const rl = createInterface({ input: stdin, crlfDelay: Infinity })
  rl.on('line', async (line) => {
    const trimmed = line.trim()
    if (!trimmed) return
    let req
    try { req = JSON.parse(trimmed) } catch { return }
    const res = await handle(req)
    if (res) stdout.write(JSON.stringify(res) + '\n')
  })
}

// ----- HTTP/SSE mode (ChatGPT + frontend) -----
function runHttp() {
  const server = createServer((req, res) => {
    const { url } = req
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', async () => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

      if (url === '/v1/responses' && req.method === 'POST') {
        try {
          const data = JSON.parse(body || '{}')
          const result = { model: data.model || 'open-higgsfeild', prompt: data.prompt, text: `Open Higgsfeild: ${data.prompt}` }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(result))
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: e.message }))
        }
        return
      }

      if (url === '/mcp' && req.method === 'GET') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        })
        const id = Math.random().toString(36).slice(2)
        const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)
        send({ type: 'endpoint', endpoint: '/mcp' })
        req.on('close', () => { res.end() })
        return
      }

      if (url === '/mcp' && req.method === 'POST') {
        try {
          const req = JSON.parse(body || '{}')
          const resp = await handle(req)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(resp))
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: e.message }))
        }
        return
      }

      res.writeHead(404)
      res.end('not found')
    })
  })
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Open Higgsfeild MCP HTTP server on http://127.0.0.1:${PORT}`)
  })
}

if (process.argv.includes('--http')) {
  runHttp()
} else {
  runStdio()
}
