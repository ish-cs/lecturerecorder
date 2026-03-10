import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  loadNotebooks: () => ipcRenderer.invoke('load-notebooks'),
  saveNotebooks: (data) => ipcRenderer.send('save-notebooks', { data }),
  saveRecording: (audioBuffer, pageId, notebookId) =>
    ipcRenderer.send('save-recording', { audioBuffer, pageId, notebookId }),
  onTranscriptionComplete: (cb) =>
    ipcRenderer.on('transcription-complete', (_, data) => cb(data)),
  onTranscriptionError: (cb) =>
    ipcRenderer.on('transcription-error', (_, data) => cb(data)),
  onRecordingSaved: (cb) =>
    ipcRenderer.on('recording-saved', (_, data) => cb(data)),
  removeListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  openExternal: (url) => ipcRenderer.send('open-external', url),
})
