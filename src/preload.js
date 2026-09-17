const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('courseApp', {
  getSchedule: () => ipcRenderer.invoke('schedule:get'),
  selectSchedule: () => ipcRenderer.invoke('schedule:select'),
  useBundledSchedule: () => ipcRenderer.invoke('schedule:use-bundled'),
  getPrompt: () => ipcRenderer.invoke('prompt:get'),
  testNotification: () => ipcRenderer.invoke('notification:test'),
  openExternal: (url) => ipcRenderer.invoke('external:open', url),
  onOpenEntry: (callback) => ipcRenderer.on('open-entry', (_, entry) => callback(entry)),
});
