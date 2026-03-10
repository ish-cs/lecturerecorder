import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function useNotebooks() {
  const [notebooks, setNotebooks] = useState([])
  const [loading, setLoading] = useState(true)
  const saveTimerRef = useRef(null)

  // Load on mount
  useEffect(() => {
    async function load() {
      if (window.electronAPI) {
        try {
          const data = await window.electronAPI.loadNotebooks()
          setNotebooks(data.notebooks || [])
        } catch (err) {
          console.error('Failed to load notebooks:', err)
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  // Debounced persist
  const persist = useCallback((notebooks) => {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      window.electronAPI?.saveNotebooks({ notebooks })
    }, 500)
  }, [])

  const updateAndSave = useCallback((updater) => {
    setNotebooks((prev) => {
      const next = updater(prev)
      persist(next)
      return next
    })
  }, [persist])

  const addNotebook = useCallback((name) => {
    const id = uuidv4()
    updateAndSave((prev) => [
      ...prev,
      { id, name: name || 'New Notebook', createdAt: new Date().toISOString(), pages: [] },
    ])
    return id
  }, [updateAndSave])

  const updateNotebook = useCallback((id, changes) => {
    updateAndSave((prev) => prev.map((nb) => (nb.id === id ? { ...nb, ...changes } : nb)))
  }, [updateAndSave])

  const removeNotebook = useCallback((id) => {
    updateAndSave((prev) => prev.filter((nb) => nb.id !== id))
  }, [updateAndSave])

  const addPage = useCallback((notebookId, name) => {
    const id = uuidv4()
    const page = {
      id,
      name: name || formatDate(new Date()),
      createdAt: new Date().toISOString(),
      content: '',
      recordingPath: null,
      transcript: null,
    }
    updateAndSave((prev) =>
      prev.map((nb) =>
        nb.id === notebookId ? { ...nb, pages: [...nb.pages, page] } : nb
      )
    )
    return id
  }, [updateAndSave])

  const updatePage = useCallback((notebookId, pageId, changes) => {
    updateAndSave((prev) =>
      prev.map((nb) =>
        nb.id === notebookId
          ? { ...nb, pages: nb.pages.map((p) => (p.id === pageId ? { ...p, ...changes } : p)) }
          : nb
      )
    )
  }, [updateAndSave])

  const removePage = useCallback((notebookId, pageId) => {
    updateAndSave((prev) =>
      prev.map((nb) =>
        nb.id === notebookId ? { ...nb, pages: nb.pages.filter((p) => p.id !== pageId) } : nb
      )
    )
  }, [updateAndSave])

  return { notebooks, loading, addNotebook, updateNotebook, removeNotebook, addPage, updatePage, removePage }
}
