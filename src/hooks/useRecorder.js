import { useState, useRef, useCallback, useEffect } from 'react'

const SAMPLE_RATE = 16000


function encodeWav(samples) {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const str = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)) }
  str(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  str(8, 'WAVE')
  str(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  str(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  let off = 44
  for (const s of samples) {
    const v = Math.max(-1, Math.min(1, s))
    view.setInt16(off, v < 0 ? v * 0x8000 : v * 0x7FFF, true)
    off += 2
  }
  return buffer
}

export function useRecorder() {
  const [state, setState] = useState('idle')
  const [duration, setDuration] = useState(0)

  const streamRef = useRef(null)
  const audioContextRef = useRef(null)
  const workletNodeRef = useRef(null)
  const sourceRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const startTimeRef = useRef(0)
  const pausedDurationRef = useRef(0)

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioContextRef.current?.close()
    }
  }, [])

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - pausedDurationRef.current * 1000
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => clearInterval(timerRef.current), [])

  const startRecording = useCallback(async (pageId, notebookId) => {
    console.log('[recorder] startRecording', { pageId, notebookId })
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('[recorder] got stream')
      streamRef.current = stream
      chunksRef.current = []
      pausedDurationRef.current = 0

      const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE })
      console.log('[recorder] AudioContext state:', audioContext.state, 'sampleRate:', audioContext.sampleRate)
      audioContextRef.current = audioContext

      // Resolve relative to the current page — works in both dev (http://localhost)
      // and packaged app (file:///...dist/index.html → file:///...dist/audio-processor.js)
      const processorUrl = new URL('./audio-processor.js', window.location.href).href
      console.log('[recorder] loading worklet from', processorUrl)
      await audioContext.audioWorklet.addModule(processorUrl)
      console.log('[recorder] AudioWorklet loaded')

      const source = audioContext.createMediaStreamSource(stream)
      sourceRef.current = source

      const workletNode = new AudioWorkletNode(audioContext, 'audio-capture')
      workletNodeRef.current = workletNode

      let chunkCount = 0
      workletNode.port.onmessage = (e) => {
        chunksRef.current.push(new Float32Array(e.data))
        chunkCount++
        if (chunkCount <= 3 || chunkCount % 50 === 0) {
          console.log('[recorder] chunk', chunkCount, 'total samples:', chunksRef.current.reduce((n, c) => n + c.length, 0))
        }
      }

      // Silent gain — worklet must reach destination to process, but we don't want speaker output
      const silentGain = audioContext.createGain()
      silentGain.gain.value = 0
      source.connect(workletNode)
      workletNode.connect(silentGain)
      silentGain.connect(audioContext.destination)
      console.log('[recorder] audio graph connected')

      setState('recording')
      setDuration(0)
      startTimer()
      console.log('[recorder] recording started')
    } catch (err) {
      console.error('[recorder] startRecording failed:', err)
      alert('Microphone access denied or unavailable.\n\n' + err.message)
    }
  }, [startTimer])

  const pauseRecording = useCallback(() => {
    if (audioContextRef.current?.state === 'running') {
      audioContextRef.current.suspend()
      pausedDurationRef.current = duration
      stopTimer()
      setState('paused')
    }
  }, [duration, stopTimer])

  const resumeRecording = useCallback(() => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume()
      startTimer()
      setState('recording')
    }
  }, [startTimer])

  const stopRecording = useCallback((pageId, notebookId) => {
    console.log('[recorder] stopRecording', { pageId, notebookId })
    stopTimer()
    setState('transcribing')

    workletNodeRef.current?.port.close()
    workletNodeRef.current?.disconnect()
    sourceRef.current?.disconnect()
    audioContextRef.current?.close()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null

    const chunks = chunksRef.current
    const total = chunks.reduce((n, c) => n + c.length, 0)
    console.log('[recorder] stopped, total samples:', total, `(${(total / SAMPLE_RATE).toFixed(2)}s)`)

    const combined = new Float32Array(total)
    let offset = 0
    for (const c of chunks) { combined.set(c, offset); offset += c.length }
    chunksRef.current = []

    const wavBuffer = encodeWav(combined)
    console.log('[recorder] WAV buffer size:', wavBuffer.byteLength, 'bytes')
    window.electronAPI?.saveRecording(wavBuffer, pageId, notebookId)

    setDuration(0)
    pausedDurationRef.current = 0
  }, [stopTimer])

  return { state, setState, duration, startRecording, pauseRecording, resumeRecording, stopRecording }
}
