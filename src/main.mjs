import path from 'node:path';
import url from 'node:url';

import { app, BrowserWindow, ipcMain } from 'electron';

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(url.fileURLToPath(import.meta.url), 'preload.cjs'),
    },
  });
  void mainWindow.loadURL('https://exercode.willbooster.com/');

  // Detect URL changes without DOM reloading
  mainWindow.webContents.on('did-navigate', () => {
    console.info('did-navigate');
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.info('did-finish-load');
    void mainWindow.webContents.executeJavaScript(`
    setInterval(function() {
      const chakraStackElem = document.querySelector('.chakra-stack');
      if (chakraStackElem && !document.querySelector('#back')) {
        const backButton = document.createElement('button');
        backButton.textContent = 'Back';
        backButton.id = 'back';
        backButton.onclick = () => window.history.back();
        const firstChild = chakraStackElem.firstChild;
        chakraStackElem.insertBefore(backButton, firstChild);

        const forwardButton = document.createElement('button');
        forwardButton.textContent = 'Forward';
        forwardButton.onclick = () => window.history.forward();
        chakraStackElem.insertBefore(forwardButton, firstChild);
      }

      const downloadElem = document.querySelector('#download');
      const executionCommandElem = document.querySelector('#execution');
      if (downloadElem && executionCommandElem) {
        downloadElem.onclick = () => { window.electron.execute(element.href); return false; };
        downloadElem.id = 'execute';
      }
    }, 100);
    `);
  });
};

app.whenReady().then(() => {
  ipcMain.on('execute', (_, url) => {
    console.info('execute:', url);
  });
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
