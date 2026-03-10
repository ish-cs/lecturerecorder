export default function TranscriptPanel({ transcript, onClose }) {
  return (
    <div className="flex flex-col bg-transcript border-l border-[#2e2e2e] shrink-0" style={{ width: 320 }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e2e2e]">
        <span className="text-sm font-medium text-gray-300">Transcript</span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg leading-none transition-colors">×</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {transcript ? (
          <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{transcript}</p>
        ) : (
          <p className="text-sm text-gray-600 italic">No recording yet for this page.</p>
        )}
      </div>

      {transcript && (
        <div className="px-4 py-3 border-t border-[#2e2e2e]">
          <button
            onClick={() => navigator.clipboard.writeText(transcript)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded bg-accent hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  )
}
