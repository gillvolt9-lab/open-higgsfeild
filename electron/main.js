import { app, BrowserWindow } from 'electron'
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

let mcpProc = null

function startMcp() {
  mcpProc = spawn('node', [join(__dirname, '..', 'mcp-server.js'), '--http'], {
    detached: true,
    stdio: 'ignore',
  })
  mcpProc.unref()
}

function createWindow() {
  const win = new BrowserWindow({
    width: 920,
    height: 720,
    title: 'Open Higgsfeild',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })
  win.loadFile(join(__dirname, '..', 'dist', 'index.html'))
  win.once('ready-to-show', () => win.show())
}

app.whenReady().then(() => {
  startMcp()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (mcpProc && !mcpProc.killed) mcpProc.kill()
})
