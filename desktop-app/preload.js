const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Server management
  startServer: (config) => ipcRenderer.invoke('start-server', config),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  
  // Database operations
  connectToDatabase: (connectionConfig) => ipcRenderer.invoke('connect-database', connectionConfig),
  disconnectFromDatabase: () => ipcRenderer.invoke('disconnect-database'),
  getConnectionStatus: () => ipcRenderer.invoke('get-connection-status'),
  executeCommand: (command, args) => ipcRenderer.invoke('execute-command', command, args),
  getDatabaseStats: () => ipcRenderer.invoke('get-database-stats'),
  getKeys: (pattern) => ipcRenderer.invoke('get-keys', pattern),
  getKeyValue: (key) => ipcRenderer.invoke('get-key-value', key),
  setKeyValue: (key, value, type) => ipcRenderer.invoke('set-key-value', key, value, type),
  deleteKey: (key) => ipcRenderer.invoke('delete-key', key),
  
  // File operations
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
  
  // App operations
  minimize: () => ipcRenderer.invoke('minimize'),
  maximize: () => ipcRenderer.invoke('maximize'),
  close: () => ipcRenderer.invoke('close'),
  isMaximized: () => ipcRenderer.invoke('is-maximized'),
  
  // Menu events
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', callback);
    return () => ipcRenderer.removeListener('menu-action', callback);
  },
  
  // Legacy menu events (for backward compatibility)
  onMenuNewConnection: (callback) => ipcRenderer.on('menu-new-connection', callback),
  onMenuImportData: (callback) => ipcRenderer.on('menu-import-data', callback),
  onMenuExportData: (callback) => ipcRenderer.on('menu-export-data', callback),
  onMenuFlushDb: (callback) => ipcRenderer.on('menu-flush-db', callback),
  onMenuShowStats: (callback) => ipcRenderer.on('menu-show-stats', callback),
  onMenuOpenCli: (callback) => ipcRenderer.on('menu-open-cli', callback),
  onMenuQueryBuilder: (callback) => ipcRenderer.on('menu-query-builder', callback),
  onMenuSettings: (callback) => ipcRenderer.on('menu-settings', callback),
  
  // Server events
  onServerStatus: (callback) => ipcRenderer.on('server-status', callback),
  onServerLog: (callback) => ipcRenderer.on('server-log', callback),
  onServerError: (callback) => ipcRenderer.on('server-error', callback),
  onServerStatusChange: (callback) => {
    ipcRenderer.on('server-status-change', callback);
    return () => ipcRenderer.removeListener('server-status-change', callback);
  },
  
  // Configuration
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (config) => ipcRenderer.invoke('set-config', config),
  
  // System info
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // Logs
  getLogs: () => ipcRenderer.invoke('get-logs'),
  clearLogs: () => ipcRenderer.invoke('clear-logs'),
  
  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  
  // Theme
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
  
  // Export/Import
  exportData: (data, format) => ipcRenderer.invoke('export-data', data, format),
  importData: (filePath) => ipcRenderer.invoke('import-data', filePath),
  
  // Utilities
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  showItemInFolder: (path) => ipcRenderer.invoke('show-item-in-folder', path),
  
  // Development
  openDevTools: () => ipcRenderer.invoke('open-dev-tools'),
  reload: () => ipcRenderer.invoke('reload'),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
