import { useState, useEffect, Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(err) { return { error: err } }
  componentDidCatch(err, info) { console.error('[ErrorBoundary]', err, info) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, background: '#1a1a1a', color: '#f87171', fontFamily: 'monospace', height: '100vh' }}>
          <h2 style={{ marginBottom: 12 }}>Render error (check DevTools console)</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{String(this.state.error)}</pre>
        </div>
      )
    }
    return this.props.children
  }
}
import Sidebar from './components/Sidebar'
import PageCanvas from './components/PageCanvas'
import RecorderBar from './components/RecorderBar'
import TranscriptPanel from './components/TranscriptPanel'
import { useNotebooks } from './hooks/useNotebooks'
import { useRecorder } from './hooks/useRecorder'

// Global error catchers — log before React gets a chance to blank the page
window.addEventListener('error', (e) => {
  console.error('[window.error]', e.message, e.filename, e.lineno, e.error)
})
window.addEventListener('unhandledrejection', (e) => {
  console.error('[unhandledrejection]', e.reason)
})

export default function App() {
  const [currentNotebookId, setCurrentNotebookId] = useState(null)
  const [currentPageId, setCurrentPageId] = useState(null)
  const [showTranscript, setShowTranscript] = useState(false)

  const { notebooks, loading, addNotebook, updateNotebook, removeNotebook, addPage, updatePage, removePage } = useNotebooks()
  const { state: recorderState, setState: setRecorderState, duration, startRecording, pauseRecording, resumeRecording, stopRecording } = useRecorder()

  const currentNotebook = notebooks.find((nb) => nb.id === currentNotebookId)
  const currentPage = currentNotebook?.pages.find((p) => p.id === currentPageId)

  useEffect(() => {
    if (!loading && notebooks.length > 0 && !currentNotebookId) {
      const nb = notebooks[0]
      setCurrentNotebookId(nb.id)
      if (nb.pages.length > 0) setCurrentPageId(nb.pages[0].id)
    }
  }, [loading, notebooks, currentNotebookId])

  useEffect(() => {
    if (!window.electronAPI) return

    window.electronAPI.onTranscriptionComplete(({ pageId, notebookId, transcript }) => {
      updatePage(notebookId, pageId, { transcript })
      setRecorderState('idle')
      setShowTranscript(true)
    })
    window.electronAPI.onTranscriptionError(({ pageId, notebookId, error }) => {
      console.error('Transcription error:', error)
      alert('Transcription failed: ' + error)
      setRecorderState('idle')
    })
    window.electronAPI.onRecordingSaved(({ pageId, notebookId, recordingPath }) => {
      updatePage(notebookId, pageId, { recordingPath })
    })

    return () => {
      window.electronAPI.removeListeners('transcription-complete')
      window.electronAPI.removeListeners('transcription-error')
      window.electronAPI.removeListeners('recording-saved')
    }
  }, [updatePage, setRecorderState])

  const handleSelectPage = (notebookId, pageId) => {
    setCurrentNotebookId(notebookId)
    setCurrentPageId(pageId)
    setShowTranscript(false)
  }

  const handleAddNotebook = (name) => {
    if (!name?.trim()) return
    const id = addNotebook(name.trim())
    setCurrentNotebookId(id)
    setCurrentPageId(null)
  }

  const handleAddPage = (notebookId, name) => {
    const id = addPage(notebookId, name)
    setCurrentNotebookId(notebookId)
    setCurrentPageId(id)
  }

  const handleStart = () => {
    if (currentPageId && currentNotebookId) startRecording(currentPageId, currentNotebookId)
  }
  const handleStop = () => {
    if (currentPageId && currentNotebookId) stopRecording(currentPageId, currentNotebookId)
  }

if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-app text-gray-400">
        Loading…
      </div>
    )
  }

  return (
    <ErrorBoundary>
    <div className="flex h-screen bg-app overflow-hidden text-gray-200">
      <Sidebar
        notebooks={notebooks}
        currentNotebookId={currentNotebookId}
        currentPageId={currentPageId}
        onSelectPage={handleSelectPage}
        onAddNotebook={handleAddNotebook}
        onAddPage={handleAddPage}
        onUpdateNotebook={updateNotebook}
        onUpdatePage={updatePage}
        onRemoveNotebook={removeNotebook}
        onRemovePage={removePage}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <RecorderBar
          recorderState={recorderState}
          duration={duration}
          onStart={handleStart}
          onPause={pauseRecording}
          onResume={resumeRecording}
          onStop={handleStop}
          showTranscript={showTranscript}
          onToggleTranscript={() => setShowTranscript((v) => !v)}
          disabled={!currentPageId}
        />

        {currentPage ? (
          <div className="flex flex-1 min-h-0">
            <PageCanvas
              page={currentPage}
              onUpdateContent={(content) => updatePage(currentNotebookId, currentPageId, { content })}
              onUpdateTitle={(name) => updatePage(currentNotebookId, currentPageId, { name })}
            />
            {showTranscript && (
              <TranscriptPanel
                transcript={currentPage.transcript}
onClose={() => setShowTranscript(false)}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-500 text-sm">
            {notebooks.length === 0 ? 'Create a notebook to get started' : 'Select or create a page'}
          </div>
        )}
      </div>
    </div>
    </ErrorBoundary>
  )
}
