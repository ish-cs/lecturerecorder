function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function Waveform() {
  return (
    <div className="flex items-center gap-0.5 h-5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="wave-bar w-0.5 bg-red-400 rounded-full" style={{ height: 4 }} />
      ))}
    </div>
  )
}

export default function RecorderBar({
  recorderState, duration, onStart, onPause, onResume, onStop,
  showTranscript, onToggleTranscript, disabled,
}) {
  const isIdle = recorderState === 'idle'
  const isRecording = recorderState === 'recording'
  const isPaused = recorderState === 'paused'
  const isTranscribing = recorderState === 'transcribing'

  return (
    <div className="titlebar-drag flex items-center gap-3 px-4 h-12 border-b border-[#2a2a2a] bg-[#141414] shrink-0">
      <div className="w-16 shrink-0" />

      <div className="titlebar-no-drag flex items-center gap-3 flex-1">
        {isIdle && (
          <button
            onClick={onStart}
            disabled={disabled}
            title="Start recording"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <div className="w-3 h-3 rounded-full bg-white" />
          </button>
        )}

        {(isRecording || isPaused) && (
          <>
            <button
              onClick={onStop}
              title="Stop recording"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2a2a2a] hover:bg-[#333] transition-colors"
            >
              <div className="w-3 h-3 rounded-sm bg-white" />
            </button>

            {isRecording ? (
              <button
                onClick={onPause}
                title="Pause"
                className="flex items-center justify-center w-7 h-7 rounded hover:bg-[#2a2a2a] transition-colors"
              >
                <div className="flex gap-0.5">
                  <div className="w-1 h-4 bg-gray-300 rounded-full" />
                  <div className="w-1 h-4 bg-gray-300 rounded-full" />
                </div>
              </button>
            ) : (
              <button
                onClick={onResume}
                title="Resume"
                className="flex items-center justify-center w-7 h-7 rounded hover:bg-[#2a2a2a] transition-colors"
              >
                <div className="w-0 h-0 border-l-[10px] border-l-gray-300 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1" />
              </button>
            )}

            <div className="flex items-center gap-2">
              {isRecording && <Waveform />}
              {isPaused && <span className="text-xs text-yellow-500 font-medium">PAUSED</span>}
              <span className={`text-sm font-mono font-medium ${isRecording ? 'text-red-400 recording-pulse' : 'text-gray-400'}`}>
                {formatDuration(duration)}
              </span>
            </div>
          </>
        )}

        {isTranscribing && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Transcribing…</span>
          </div>
        )}

        <div className="flex-1" />

        <button
          onClick={onToggleTranscript}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
            ${showTranscript ? 'bg-accent text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a]'}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Transcript
        </button>
      </div>
    </div>
  )
}
