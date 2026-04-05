const { app, BrowserWindow } = require('electron');
const process = require('process');

console.log('Main process started');

let mainWindow;

function createWindow() {
  console.log('App is ready, creating window...');
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load React app
  console.log('Loading URL http://localhost:5173');
  mainWindow.loadURL('http://localhost:5173').then(() => {
    console.log('URL loaded successfully');
  }).catch(err => {
    console.error('Failed to load URL:', err);
  });

  mainWindow.on('closed', () => {
    console.log('Window closed');
    mainWindow = null;
  });
}

app.whenReady().then(createWindow).catch(err => console.error('Error on whenReady:', err));

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});