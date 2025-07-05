const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 320,
    height: 600,
    minWidth: 300,
    minHeight: 500,
    resizable: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: 'Aisuma Calculator',
    icon: path.join(__dirname, 'assets/icon.png')
  });

  mainWindow.loadFile('index.html');

  // Uncomment the line below to open DevTools in development
  // mainWindow.webContents.openDevTools();
}

// IPC handler (hanya didaftarkan sekali)
ipcMain.on('toggle-always-on-top', (event, isAlwaysOnTop) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setAlwaysOnTop(isAlwaysOnTop);
  }
});

ipcMain.on('minimize-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize();
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
});

app.whenReady().then(() => {
  createWindow();

  // Remove default menu (including Help menu)
  Menu.setApplicationMenu(null);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
}); 