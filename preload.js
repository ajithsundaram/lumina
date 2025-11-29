const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  connectDB: (config) => ipcRenderer.invoke('db:connect', config),
  runQuery: (sql) => ipcRenderer.invoke('db:runQuery', sql),
  getSchema: () => ipcRenderer.invoke('db:getSchema'),
  generateSQL: (naturalLanguage, schema, model) =>
  ipcRenderer.invoke('ai:generateSQL', { naturalLanguage, schema, model })
});
