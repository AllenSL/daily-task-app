const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadTasks: () => ipcRenderer.invoke('tasks:load'),
  saveTasks: (payload) => ipcRenderer.invoke('tasks:save', payload),
  getUserDataPath: () => ipcRenderer.invoke('app:userData'),
  hideToTray: () => ipcRenderer.send('window:hide-to-tray'),
  setCompactMode: (compact) => ipcRenderer.invoke('window:setCompact', Boolean(compact)),
  setStealthMode: (stealth) => ipcRenderer.invoke('window:setStealth', Boolean(stealth)),
  quitApp: () => ipcRenderer.send('app:quit')
});
