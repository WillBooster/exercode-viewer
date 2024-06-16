const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  execute: (url) => ipcRenderer.send('execute', url),
});
