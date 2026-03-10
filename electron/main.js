import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow

const isDev = !app.isPackaged

// ── Paths ────────────────────────────────────────────────────────────────────

function getBaseDir() {
  return isDev ? process.cwd() : app.getPath('userData')
}
function getDataDir() { return path.join(getBaseDir(), 'data') }
function getRecordingsDir() { return path.join(getBaseDir(), 'recordings') }
function getNotebooksFile() { return path.join(getDataDir(), 'notebooks.json') }

function getFfmpegPath() {
  if (isDev) {
    // Use ffmpeg-static from node_modules in dev
    try {
      const ffmpegStatic = require('ffmpeg-static')
      if (ffmpegStatic && fs.existsSync(ffmpegStatic)) return ffmpegStatic
    } catch {}
    // Fallback to system ffmpeg
    for (const p of ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg']) {
      if (fs.existsSync(p)) return p
    }
    return 'ffmpeg'
  }
  // Packaged: ffmpeg-static is asar-unpacked
  const packed = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'ffmpeg-static', 'ffmpeg')
  return fs.existsSync(packed) ? packed : 'ffmpeg'
}

function getWhisperBin() {
  if (isDev) {
    return path.join(process.cwd(), 'node_modules', 'whisper-node', 'lib', 'whisper.cpp', 'main')
  }
  return path.join(process.resourcesPath, 'whisper-main')
}

function getModelPath() {
  if (isDev) {
    return path.join(process.cwd(), 'models', 'ggml-base.en.bin')
  }
  return path.join(process.resourcesPath, 'models', 'ggml-base.en.bin')
}

function ensureDirs() {
  for (const dir of [getDataDir(), getRecordingsDir()]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  }
}

// ── Window ───────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1a1a1a',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  ensureDirs()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC ──────────────────────────────────────────────────────────────────────

ipcMain.on('open-external', (_, url) => shell.openExternal(url))

ipcMain.handle('load-notebooks', () => {
  const file = getNotebooksFile()
  if (!fs.existsSync(file)) return { notebooks: [] }
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')) }
  catch { return { notebooks: [] } }
})

ipcMain.on('save-notebooks', (_event, { data }) => {
  try { fs.writeFileSync(getNotebooksFile(), JSON.stringify(data, null, 2), 'utf-8') }
  catch (err) { console.error('Failed to save notebooks:', err) }
})

ipcMain.on('save-recording', (_event, { audioBuffer, pageId, notebookId }) => {
  const recordingsDir = getRecordingsDir()
  const wavPath = path.join(recordingsDir, `${pageId}.wav`)

  // audioBuffer is already a 16kHz mono WAV (encoded in the renderer)
  try {
    fs.writeFileSync(wavPath, Buffer.from(audioBuffer))
  } catch (err) {
    mainWindow.webContents.send('transcription-error', { pageId, notebookId, error: 'Failed to save audio: ' + err.message })
    return
  }

  mainWindow.webContents.send('recording-saved', { pageId, notebookId, recordingPath: `recordings/${pageId}.wav` })

  const whisperBin = getWhisperBin()
  const modelPath = getModelPath()

  if (!fs.existsSync(whisperBin)) {
    mainWindow.webContents.send('transcription-error', { pageId, notebookId, error: `Whisper binary not found at: ${whisperBin}` })
    return
  }
  if (!fs.existsSync(modelPath)) {
    mainWindow.webContents.send('transcription-error', { pageId, notebookId, error: `Model not found at: ${modelPath}. Run setup to download.` })
    return
  }

  const whisperCwd = isDev
    ? path.join(process.cwd(), 'node_modules', 'whisper-node', 'lib', 'whisper.cpp')
    : process.resourcesPath

  const whisper = spawn(whisperBin, ['-m', modelPath, '-f', wavPath, '-l', 'en', '--no-timestamps'], { cwd: whisperCwd })
  let stdout = ''
  let stderr = ''

  whisper.stdout.on('data', (d) => { stdout += d.toString() })
  whisper.stderr.on('data', (d) => { stderr += d.toString() })

  whisper.on('close', (code) => {
    const parsed = parseWhisperOutput(stdout) || parseWhisperOutput(stderr)

    if (code !== 0 && !parsed) {
      mainWindow.webContents.send('transcription-error', {
        pageId, notebookId,
        error: `Whisper exit ${code}: ${stderr || stdout || 'no output'}`,
      })
      return
    }

    mainWindow.webContents.send('transcription-complete', {
      pageId, notebookId,
      transcript: parsed || '(No speech detected)',
    })
  })
})

// Parse whisper.cpp output — handles both timestamped and plain text output
function parseWhisperOutput(raw) {
  if (!raw || !raw.trim()) return null
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  // Strip timestamped lines: "[00:00:00.000 --> 00:00:05.000]   text"
  const withTs = lines.filter(l => l.match(/^\[[\d:.]+\s*-->\s*[\d:.]+\]/))
  if (withTs.length > 0) {
    return withTs.map(l => l.replace(/^\[.*?\]\s*/, '').trim()).join(' ').trim()
  }
  // Plain text: filter out whisper.cpp log lines (they start with specific chars)
  const text = lines.filter(l => !l.startsWith('whisper_') && !l.startsWith('ggml_') && !l.startsWith('[') && !l.startsWith('main:') && !l.startsWith('system_info')).join(' ').trim()
  return text || null
}
