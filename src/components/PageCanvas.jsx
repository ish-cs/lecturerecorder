import { useEffect, useRef, useCallback, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Color } from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'

// ── Toolbar ───────────────────────────────────────────────────────────────────

function ToolbarButton({ onClick, active, title, children }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={`px-2 py-1 rounded text-sm font-medium transition-colors
        ${active
          ? 'bg-accent text-white'
          : 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a]'
        }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-4 bg-[#3a3a3a] mx-1" />
}

function Toolbar({ editor, onImageUpload }) {
  const [linkInput, setLinkInput] = useState(null) // null | '' | 'https://...'
  const linkRef = useRef(null)
  const colorRef = useRef(null)

  useEffect(() => {
    if (linkInput !== null) linkRef.current?.focus()
  }, [linkInput])

  if (!editor) return null

  const btn = (action, isActive, label, title) => (
    <ToolbarButton onClick={action} active={isActive} title={title}>{label}</ToolbarButton>
  )

  const commitLink = () => {
    const url = linkInput?.trim()
    if (url) {
      editor.chain().focus().setLink({ href: url.startsWith('http') ? url : 'https://' + url }).run()
    } else {
      editor.chain().focus().unsetLink().run()
    }
    setLinkInput(null)
  }

  const openLinkInput = () => {
    const existing = editor.getAttributes('link').href || ''
    setLinkInput(existing)
  }

  return (
    <div className="flex items-center gap-0.5 px-4 py-1.5 border-b border-[#2a2a2a] bg-[#1a1a1a] flex-wrap">
      {btn(() => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), <strong>B</strong>, 'Bold')}
      {btn(() => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), <em>I</em>, 'Italic')}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Underline"
      >
        <span className="underline">U</span>
      </ToolbarButton>
      {btn(() => editor.chain().focus().toggleCode().run(), editor.isActive('code'), '</>', 'Inline code')}

      <Divider />

      {btn(() => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }), 'H1', 'Heading 1')}
      {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }), 'H2', 'Heading 2')}
      {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }), 'H3', 'Heading 3')}

      <Divider />

      {btn(() => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'), '• List', 'Bullet list')}
      {btn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'), '1. List', 'Numbered list')}
      {btn(() => editor.chain().focus().toggleCodeBlock().run(), editor.isActive('codeBlock'), 'Code', 'Code block')}
      {btn(() => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'), '" Quote', 'Blockquote')}

      <Divider />

      {/* Link */}
      {linkInput !== null ? (
        <div className="flex items-center gap-1">
          <input
            ref={linkRef}
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commitLink() }
              if (e.key === 'Escape') setLinkInput(null)
            }}
            onBlur={commitLink}
            placeholder="https://..."
            className="bg-[#2a2a2a] text-gray-200 text-xs px-2 py-1 rounded outline-none w-40 placeholder-gray-600"
          />
        </div>
      ) : (
        <ToolbarButton onClick={openLinkInput} active={editor.isActive('link')} title="Insert link">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </ToolbarButton>
      )}

      {/* Text color */}
      <div className="relative">
        <button
          title="Text color"
          onMouseDown={(e) => { e.preventDefault(); colorRef.current?.click() }}
          className="px-1.5 py-1 rounded text-sm transition-colors text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a] flex flex-col items-center gap-0.5"
        >
          <span className="font-bold leading-none text-xs">A</span>
          <span
            className="w-3.5 h-1 rounded-full"
            style={{ backgroundColor: editor.getAttributes('textStyle').color || '#6366f1' }}
          />
        </button>
        <input
          ref={colorRef}
          type="color"
          defaultValue="#6366f1"
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        />
      </div>

      {/* Reset color */}
      <ToolbarButton
        onClick={() => editor.chain().focus().unsetColor().run()}
        active={false}
        title="Reset text color"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </ToolbarButton>

      <Divider />

      {/* Image upload */}
      <ToolbarButton onClick={onImageUpload} active={false} title="Insert image">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </ToolbarButton>
    </div>
  )
}

// ── PageTitle ─────────────────────────────────────────────────────────────────

function PageTitle({ name, onSave, onEnter }) {
  const handleBlur = (e) => {
    const text = e.currentTarget.textContent.trim()
    if (text && text !== name) onSave(text)
    else if (!text) e.currentTarget.textContent = name
  }
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onEnter() } }}
      className="text-4xl font-bold text-white outline-none cursor-text"
      style={{ minHeight: '1.2em', whiteSpace: 'pre-wrap' }}
      dangerouslySetInnerHTML={{ __html: name }}
    />
  )
}

// ── PageCanvas ────────────────────────────────────────────────────────────────

export default function PageCanvas({ page, onUpdateContent, onUpdateTitle }) {
  const saveTimerRef = useRef(null)
  const fileInputRef = useRef(null)

  const debouncedSave = useCallback((html) => {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => onUpdateContent(html), 500)
  }, [onUpdateContent])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'editor-link' } }),
    ],
    content: page?.content || '',
    editorProps: {
      attributes: { class: 'tiptap-editor px-8 py-6 min-h-full focus:outline-none' },
    },
    onUpdate: ({ editor }) => debouncedSave(editor.getHTML()),
  })

  // Sync content when switching pages
  useEffect(() => {
    if (editor && page) editor.commands.setContent(page.content || '', false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.id])

  // Image paste handler
  useEffect(() => {
    if (!editor) return
    const el = editor.view.dom
    const onPaste = (e) => {
      const items = Array.from(e.clipboardData?.items || [])
      const imageItem = items.find((i) => i.type.startsWith('image/'))
      if (!imageItem) return
      e.preventDefault()
      const file = imageItem.getAsFile()
      const reader = new FileReader()
      reader.onload = (ev) => editor.chain().focus().setImage({ src: ev.target.result }).run()
      reader.readAsDataURL(file)
    }
    el.addEventListener('paste', onPaste)
    return () => el.removeEventListener('paste', onPaste)
  }, [editor])

  // Image drop handler
  useEffect(() => {
    if (!editor) return
    const el = editor.view.dom
    const onDrop = (e) => {
      const files = Array.from(e.dataTransfer?.files || []).filter((f) => f.type.startsWith('image/'))
      if (!files.length) return
      e.preventDefault()
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (ev) => editor.chain().focus().setImage({ src: ev.target.result }).run()
        reader.readAsDataURL(file)
      })
    }
    el.addEventListener('drop', onDrop)
    return () => el.removeEventListener('drop', onDrop)
  }, [editor])

  // Link click → open in system browser
  useEffect(() => {
    if (!editor) return
    const el = editor.view.dom
    const onClick = (e) => {
      const anchor = e.target.closest('a[href]')
      if (anchor) {
        e.preventDefault()
        window.electronAPI?.openExternal(anchor.href)
      }
    }
    el.addEventListener('click', onClick)
    return () => el.removeEventListener('click', onClick)
  }, [editor])

  const handleImageUpload = () => fileInputRef.current?.click()

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'))
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => editor?.chain().focus().setImage({ src: ev.target.result }).run()
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  if (!page) return (
    <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
      No page selected
    </div>
  )

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 bg-app overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <Toolbar editor={editor} onImageUpload={handleImageUpload} />
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 pt-10 pb-2">
          <PageTitle key={page.id} name={page.name} onSave={onUpdateTitle} onEnter={() => editor?.commands.focus('start')} />
          <div className="h-px bg-[#2a2a2a] mt-4" />
        </div>
        <EditorContent editor={editor} className="flex-1 min-h-0" />
      </div>
    </div>
  )
}
