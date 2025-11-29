const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { createMySQLClient } = require('./db/mysqlClient');
const { generateSQLFromText } = require('./ai/openRouterClient');

let mainWindow;
let dbClient = null; // store current DB client

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src/renderer/index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers

ipcMain.handle('db:connect', async (_event, config) => {
  // config: { host, port, user, password, database }
  if (dbClient) {
    await dbClient.close();
    dbClient = null;
  }

  dbClient = await createMySQLClient(config);
  return { success: true };
});

ipcMain.handle('db:runQuery', async (_event, sql) => {
  if (!dbClient) {
    throw new Error('Not connected to any database');
  }
  const rows = await dbClient.query(sql);
  return rows;
});

ipcMain.handle('db:getSchema', async () => {
  if (!dbClient) {
    throw new Error('Not connected to any database');
  }
  const schema = await dbClient.getSchema();
  return schema;
});

ipcMain.handle('ai:generateSQL', async (_event, { naturalLanguage, schema, model }) => {
  return await generateSQLFromText(naturalLanguage, schema, model);
});
