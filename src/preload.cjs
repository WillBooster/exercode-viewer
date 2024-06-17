const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  execute: (zipUrl, buffer, executionCommand) => ipcRenderer.send('execute', zipUrl, buffer, executionCommand),
});
