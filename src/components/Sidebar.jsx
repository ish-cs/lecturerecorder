import { useState, useRef, useEffect } from 'react'

function EditableLabel({ value, onSave, className = '' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const commit = () => {
    setEditing(false)
    if (draft.trim() && draft.trim() !== value) onSave(draft.trim())
    else setDraft(value)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setDraft(value); setEditing(false) }
        }}
        className="bg-[#2a2a2a] text-gray-100 text-sm px-1 rounded outline-none w-full"
        onClick={(e) => e.stopPropagation()}
      />
    )
  }

  return (
    <span
      className={`truncate ${className}`}
      onDoubleClick={(e) => { e.stopPropagation(); setDraft(value); setEditing(true) }}
    >
      {value}
    </span>
  )
}

function InlineInput({ placeholder, onCommit, onCancel }) {
  const [value, setValue] = useState('')
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus() }, [])

  const commit = () => {
    const v = value.trim()
    if (v) onCommit(v)
    else onCancel()
  }

  return (
    <div className="flex items-center gap-1 px-3 py-1">
      <input
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') onCancel()
        }}
        className="flex-1 bg-[#2a2a2a] text-gray-100 text-sm px-2 py-1 rounded outline-none placeholder-gray-600 min-w-0"
      />
    </div>
  )
}

function NotebookItem({ notebook, currentPageId, onSelectPage, onAddPage, onUpdateNotebook, onUpdatePage, onRemoveNotebook, onRemovePage }) {
  const [expanded, setExpanded] = useState(true)
  const [addingPage, setAddingPage] = useState(false)

  return (
    <div className="mb-1">
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-[#1f1f1f] rounded group"
        onClick={() => setExpanded((v) => !v)}
      >
        <svg
          className={`w-3 h-3 text-gray-500 transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}
          fill="currentColor" viewBox="0 0 20 20"
        >
          <path d="M7.293 4.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L10.586 9 7.293 5.707a1 1 0 010-1.414z" />
        </svg>
        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <EditableLabel
          value={notebook.name}
          onSave={(name) => onUpdateNotebook(notebook.id, { name })}
          className="text-gray-200 text-sm font-medium flex-1 min-w-0"
        />
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (window.confirm(`Delete notebook "${notebook.name}"? This cannot be undone.`)) {
              onRemoveNotebook(notebook.id)
            }
          }}
          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-xs px-1 transition-opacity"
          title="Delete notebook"
        >
          ×
        </button>
      </div>

      {expanded && (
        <div className="ml-4">
          {notebook.pages.map((page) => (
            <div
              key={page.id}
              onClick={() => onSelectPage(notebook.id, page.id)}
              className={`flex items-center gap-2 px-3 py-1 rounded cursor-pointer group text-sm
                ${page.id === currentPageId
                  ? 'border-l-2 border-accent bg-[#1e1e2e] text-gray-100'
                  : 'text-gray-400 hover:bg-[#1f1f1f] hover:text-gray-200 border-l-2 border-transparent'
                }`}
            >
              <svg className="w-3 h-3 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <EditableLabel
                value={page.name}
                onSave={(name) => onUpdatePage(notebook.id, page.id, { name })}
                className="flex-1 min-w-0"
              />
              {page.recordingPath && (
                <span className="text-[10px] text-accent opacity-70" title="Has recording">●</span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm(`Delete page "${page.name}"?`)) {
                    onRemovePage(notebook.id, page.id)
                  }
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity"
              >×</button>
            </div>
          ))}

          {addingPage ? (
            <InlineInput
              placeholder="Page name…"
              onCommit={(name) => { setAddingPage(false); onAddPage(notebook.id, name) }}
              onCancel={() => setAddingPage(false)}
            />
          ) : (
            <button
              onClick={() => setAddingPage(true)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs text-gray-500 hover:text-gray-300 hover:bg-[#1f1f1f] rounded w-full transition-colors"
            >
              <span className="text-base leading-none">+</span>
              <span>New page</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({
  notebooks, currentNotebookId, currentPageId,
  onSelectPage, onAddNotebook, onAddPage,
  onUpdateNotebook, onUpdatePage, onRemoveNotebook, onRemovePage,
}) {
  const [addingNotebook, setAddingNotebook] = useState(false)

  return (
    <div className="flex flex-col bg-sidebar border-r border-[#2a2a2a] shrink-0" style={{ width: 240 }}>
      <div className="titlebar-drag h-10 flex items-center px-4 pt-1">
        <span className="titlebar-no-drag text-xs text-gray-500 font-medium tracking-wide uppercase ml-16">
          LectureRecorder
        </span>
      </div>

      <div className="px-3 pb-2">
        {addingNotebook ? (
          <InlineInput
            placeholder="Notebook name…"
            onCommit={(name) => { setAddingNotebook(false); onAddNotebook(name) }}
            onCancel={() => setAddingNotebook(false)}
          />
        ) : (
          <button
            onClick={() => setAddingNotebook(true)}
            className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-[#1f1f1f] rounded transition-colors"
          >
            <span className="text-base leading-none">+</span>
            <span>New notebook</span>
          </button>
        )}
      </div>

      <div className="h-px bg-[#2a2a2a] mx-3 mb-2" />

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {notebooks.length === 0 && !addingNotebook ? (
          <p className="text-xs text-gray-600 px-3 py-2">No notebooks yet</p>
        ) : (
          notebooks.map((nb) => (
            <NotebookItem
              key={nb.id}
              notebook={nb}
              currentPageId={currentPageId}
              onSelectPage={onSelectPage}
              onAddPage={onAddPage}
              onUpdateNotebook={onUpdateNotebook}
              onUpdatePage={onUpdatePage}
              onRemoveNotebook={onRemoveNotebook}
              onRemovePage={onRemovePage}
            />
          ))
        )}
      </div>
    </div>
  )
}
