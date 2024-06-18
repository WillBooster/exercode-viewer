const child_process = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { BrowserWindow, app, ipcMain } = require('electron');
const fflate = require('fflate');

const createWindow = () => {
  const { screen } = require('electron');
  const { height, width } = screen.getPrimaryDisplay().workAreaSize;
  const mainWindow = new BrowserWindow({
    width,
    height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      devTools: false,
    },
  });
  void mainWindow.loadURL('https://exercode.willbooster.com/');
  mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('did-finish-load', () => {
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
    const zipUrl = downloadElem.href;
    downloadElem.onclick = async () => {
      const response = await fetch(zipUrl);
      const buffer = await response.arrayBuffer();
      window.electron.execute(zipUrl, buffer, executionCommandElem.textContent);
    };
    downloadElem.removeAttribute('href');
    downloadElem.id = 'execute';
    downloadElem.textContent = 'Execute on Your PC';
  }
}, 100);
    `);
  });
};

app.whenReady().then(() => {
  ipcMain.on('execute', async (_, zipUrl, buffer, executionCommand) => {
    const tempDir = path.join(os.tmpdir(), 'exercode');
    fs.rmSync(tempDir, { force: true, recursive: true });

    const uint8Array = new Uint8Array(buffer);
    const files = fflate.unzipSync(uint8Array);
    for (const [filename, fileData] of Object.entries(files)) {
      const filePath = path.join(tempDir, filename);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, fileData);
    }

    const dirName = new URL(zipUrl).pathname.split('/').at(-1);
    const dirPath = path.join(tempDir, dirName);

    let command;
    let args;
    let shell = false;
    executionCommand = executionCommand.split(' && ').slice(2).join(' && ');
    switch (os.platform()) {
      case 'win32': {
        // Windows
        command = 'start';
        args = ['cmd', '/K', `"cd ${dirPath} && ${executionCommand}"`];
        shell = true;
        break;
      }
      case 'darwin': {
        // macOS
        command = 'osascript';
        args = [
          '-e',
          `tell app "Terminal" to do script "cd ${dirPath} && ${executionCommand.replaceAll('"', "'")}"`,
          '-e',
          'tell app "Terminal" to activate',
        ];
        break;
      }
      default: {
        // Linux
        command = 'gnome-terminal';
        args = ['--', 'bash', '-c', `cd ${dirPath} && ${executionCommand}`];
        break;
      }
    }
    child_process.spawn(command, args, { shell });
  });
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
