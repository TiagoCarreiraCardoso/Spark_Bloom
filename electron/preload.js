const { contextBridge, ipcRenderer } = require('electron');

// Expõe APIs seguras para o renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Controlo do servidor
  startServer: () => ipcRenderer.invoke('start-server'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  restartServer: () => ipcRenderer.invoke('restart-server'),
  openBrowser: () => ipcRenderer.invoke('open-browser'),
  
  // Listeners de eventos
  onServerStatus: (callback) => {
    ipcRenderer.on('server-status', (event, data) => callback(data));
  },
  onLogMessage: (callback) => {
    ipcRenderer.on('log-message', (event, data) => callback(data));
  }
});
