const { app, BrowserWindow, Menu, dialog, ipcMain, shell, nativeTheme } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');

// Simple storage alternative without electron-store
const store = {
  data: {},
  get: function(key, defaultValue) {
    return this.data[key] !== undefined ? this.data[key] : defaultValue;
  },
  set: function(key, value) {
    this.data[key] = value;
  }
};

let mainWindow;
let serverProcess;

function createWindow() {
  console.log('Creating main window...');
  
  // Create the browser window with absolute minimal config
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  console.log('Window created successfully');

  // Load the app
  const startUrl = 'http://localhost:3000';
  console.log('Loading URL:', startUrl);
  
  mainWindow.loadURL(startUrl);

  console.log('URL loaded, setting up event handlers');

  // Add error handling for load failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    console.log('Main window closed');
    mainWindow = null;
  });

  // Create application menu
  createMenu();

  console.log('Window setup complete');
}

function createMenu() {
  const sendMenuAction = (action) => {
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', action);
    }
  };

  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Connection',
          accelerator: 'CmdOrCtrl+N',
          click: () => sendMenuAction('new-connection')
        },
        { type: 'separator' },
        {
          label: 'Import Data',
          click: () => sendMenuAction('import-data')
        },
        {
          label: 'Export Data',
          click: () => sendMenuAction('export-data')
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Database',
      submenu: [
        {
          label: 'Start Local Server',
          click: () => startLocalServer()
        },
        {
          label: 'Stop Local Server',
          click: () => stopLocalServer()
        },
        { type: 'separator' },
        {
          label: 'Flush Database',
          click: () => sendMenuAction('flush-db')
        },
        {
          label: 'Show Statistics',
          accelerator: 'CmdOrCtrl+I',
          click: () => sendMenuAction('show-stats')
        }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Redis CLI',
          click: () => sendMenuAction('open-cli')
        },
        {
          label: 'Query Builder',
          click: () => sendMenuAction('query-builder')
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => sendMenuAction('settings')
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://github.com/Byukusenge-Andrew/Cachedb')
        },
        {
          label: 'About CacheDB',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About CacheDB',
              message: 'CacheDB Desktop',
              detail: 'A modern Redis-like database management application\nVersion 1.0.0\n\nBuilt with Electron and React'
            });
          }
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
const net = require('net');
let dbConnection = null;
let isConnected = false;

// Helper function to connect to the C++ database server
const connectToDatabase = (host = 'localhost', port = 6379) => {
  return new Promise((resolve, reject) => {
    // Close existing connection if any
    if (dbConnection && !dbConnection.destroyed) {
      dbConnection.removeAllListeners();
      dbConnection.destroy();
    }

    dbConnection = new net.Socket();
    dbConnection.setMaxListeners(20); // Increase max listeners to prevent warnings
    
    dbConnection.connect(port, host, () => {
      console.log('Connected to database server');
      isConnected = true;
      resolve(dbConnection);
    });

    dbConnection.on('error', (err) => {
      console.error('Database connection error:', err);
      isConnected = false;
      dbConnection = null;
      reject(err);
    });

    dbConnection.on('close', () => {
      console.log('Database connection closed');
      isConnected = false;
      dbConnection = null;
    });

    dbConnection.on('end', () => {
      console.log('Database connection ended');
      isConnected = false;
      dbConnection = null;
    });

    // Set timeout for connection
    const connectionTimeout = setTimeout(() => {
      console.log('Database connection timeout');
      isConnected = false;
      if (dbConnection && !dbConnection.destroyed) {
        dbConnection.destroy();
      }
      dbConnection = null;
      reject(new Error('Connection timeout'));
    }, 10000);

    // Clear timeout on successful connection
    dbConnection.once('connect', () => {
      clearTimeout(connectionTimeout);
    });
  });
};

// Helper function to send command to database server
const sendCommand = (command) => {
  return new Promise(async (resolve, reject) => {
    try {
      // First ensure we have a connection
      if (!dbConnection || dbConnection.destroyed || !isConnected) {
        console.log('No connection, attempting to reconnect...');
        try {
          await connectToDatabase();
        } catch (error) {
          reject(new Error('Failed to establish database connection: ' + error.message));
          return;
        }
      }

      // Double check connection status
      if (!dbConnection || dbConnection.destroyed || !isConnected) {
        reject(new Error('Not connected to database'));
        return;
      }

      let responseData = '';
      let timeoutId;
      let dataHandler;
      let errorHandler;
      
      dataHandler = (data) => {
        responseData += data.toString();
        // Simple protocol: responses end with \r\n or just \n
        if (responseData.includes('\n')) {
          clearTimeout(timeoutId);
          if (dbConnection) {
            dbConnection.removeListener('data', dataHandler);
            dbConnection.removeListener('error', errorHandler);
          }
          resolve(responseData.trim());
        }
      };

      errorHandler = (err) => {
        clearTimeout(timeoutId);
        if (dbConnection) {
          dbConnection.removeListener('data', dataHandler);
          dbConnection.removeListener('error', errorHandler);
        }
        isConnected = false;
        dbConnection = null;
        reject(err);
      };

      // Set timeout for command response
      timeoutId = setTimeout(() => {
        if (dbConnection) {
          dbConnection.removeListener('data', dataHandler);
          dbConnection.removeListener('error', errorHandler);
        }
        reject(new Error('Command timeout'));
      }, 5000);

      dbConnection.on('data', dataHandler);
      dbConnection.on('error', errorHandler);
      
      // Send command with proper protocol format
      console.log('Sending command:', command);
      dbConnection.write(command + '\r\n');
    } catch (error) {
      reject(error);
    }
  });
};

const setupIpcHandlers = () => {

  // Server management
  ipcMain.handle('start-server', (event, config) => startLocalServer(config));
  ipcMain.handle('stop-server', () => stopLocalServer());
  ipcMain.handle('get-server-status', () => ({ status: serverProcess ? 'started' : 'stopped' }));

  // Database operations
  ipcMain.handle('connect-database', async (event, connectionConfig) => {
    console.log('Connecting to database:', connectionConfig);
    try {
      const host = connectionConfig.host || 'localhost';
      const port = parseInt(connectionConfig.port) || 6379;
      
      await connectToDatabase(host, port);
      return { success: true, message: 'Connected to database successfully' };
    } catch (error) {
      console.error('Database connection failed:', error);
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('disconnect-database', async () => {
    console.log('Disconnecting from database');
    try {
      if (dbConnection && !dbConnection.destroyed) {
        dbConnection.removeAllListeners();
        dbConnection.destroy();
      }
      isConnected = false;
      dbConnection = null;
      return { success: true, message: 'Disconnected from database' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Add connection status check
  ipcMain.handle('get-connection-status', async () => {
    console.log('Get connection status request - isConnected:', isConnected, 'dbConnection exists:', !!dbConnection);
    return { 
      connected: isConnected && dbConnection && !dbConnection.destroyed,
      message: isConnected ? 'Connected' : 'Disconnected'
    };
  });
  
  ipcMain.handle('execute-command', async (event, command, args) => {
    console.log(`Executing command: ${command}`, args);
    try {
      // Format command for the C++ server protocol
      const fullCommand = args && args.length > 0 ? `${command} ${args.join(' ')}` : command;
      const response = await sendCommand(fullCommand);
      
      return { success: true, result: response };
    } catch (error) {
      console.error('Command execution error:', error);
      return { success: false, error: error.message };
    }
  });

  // Key operations using real database commands
  ipcMain.handle('get-keys', async (event, pattern = '*') => {
    console.log('Get keys request:', pattern);
    try {
      const response = await sendCommand(`KEYS ${pattern}`);
      // Parse the response - assuming it returns keys separated by newlines
      const keys = response ? response.split('\n').filter(key => key.trim()) : [];
      return { success: true, keys };
    } catch (error) {
      console.error('Get keys error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-key-value', async (event, key) => {
    console.log('Get key value request:', key);
    try {
      // First get the type
      const typeResponse = await sendCommand(`TYPE ${key}`);
      const type = typeResponse.toLowerCase();
      
      let value;
      switch (type) {
        case 'string':
          value = await sendCommand(`GET ${key}`);
          break;
        case 'list':
          value = await sendCommand(`LRANGE ${key} 0 -1`);
          break;
        case 'set':
          value = await sendCommand(`SMEMBERS ${key}`);
          break;
        case 'hash':
          value = await sendCommand(`HGETALL ${key}`);
          break;
        case 'zset':
          value = await sendCommand(`ZRANGE ${key} 0 -1 WITHSCORES`);
          break;
        default:
          value = await sendCommand(`GET ${key}`);
      }
      
      // Get TTL
      const ttl = await sendCommand(`TTL ${key}`);
      
      return { 
        success: true, 
        value: value,
        type: type,
        ttl: parseInt(ttl) || -1
      };
    } catch (error) {
      console.error('Get key value error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('set-key-value', async (event, key, value, type = 'string') => {
    console.log('Set key value request:', { key, value, type });
    try {
      let command;
      switch (type.toLowerCase()) {
        case 'string':
          command = `SET ${key} "${value}"`;
          break;
        case 'list':
          // For lists, we'll use RPUSH
          command = `RPUSH ${key} "${value}"`;
          break;
        case 'set':
          command = `SADD ${key} "${value}"`;
          break;
        case 'hash':
          // For hashes, value should be field value pairs
          command = `HSET ${key} ${value}`;
          break;
        default:
          command = `SET ${key} "${value}"`;
      }
      
      const response = await sendCommand(command);
      return { success: true, message: 'Key set successfully', result: response };
    } catch (error) {
      console.error('Set key value error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-key', async (event, key) => {
    console.log('Delete key request:', key);
    try {
      const response = await sendCommand(`DEL ${key}`);
      return { success: true, message: 'Key deleted successfully', result: response };
    } catch (error) {
      console.error('Delete key error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-database-stats', async (event) => {
    console.log('Get database stats request');
    try {
      // Get various stats from the database
      const info = await sendCommand('INFO');
      const dbsize = await sendCommand('DBSIZE');
      
      // Parse the INFO response to extract stats
      const stats = {
        total_keys: parseInt(dbsize) || 0,
        memory_usage: '0MB',
        uptime: '0s',
        connections: 1,
        commands_processed: 0,
        keyspace_hits: 0,
        keyspace_misses: 0
      };
      
      // Parse INFO response for additional stats
      if (info) {
        const lines = info.split('\n');
        lines.forEach(line => {
          if (line.includes(':')) {
            const [key, value] = line.split(':');
            switch (key.trim()) {
              case 'used_memory_human':
                stats.memory_usage = value.trim();
                break;
              case 'uptime_in_seconds':
                const seconds = parseInt(value.trim());
                stats.uptime = seconds > 3600 ? 
                  `${Math.floor(seconds/3600)}h ${Math.floor((seconds%3600)/60)}m` :
                  `${Math.floor(seconds/60)}m ${seconds%60}s`;
                break;
              case 'total_commands_processed':
                stats.commands_processed = parseInt(value.trim()) || 0;
                break;
              case 'keyspace_hits':
                stats.keyspace_hits = parseInt(value.trim()) || 0;
                break;
              case 'keyspace_misses':
                stats.keyspace_misses = parseInt(value.trim()) || 0;
                break;
              default:
                // Ignore unknown fields
                break;
            }
          }
        });
      }
      
      return { success: true, stats };
    } catch (error) {
      console.error('Get database stats error:', error);
      return { success: false, error: error.message };
    }
  });

  // File I/O operations
  ipcMain.handle('read-file', async (event, filePath) => {
    console.log('Reading file:', filePath);
    try {
      const fs = require('fs').promises;
      const data = await fs.readFile(filePath, 'utf8');
      return { success: true, data };
    } catch (error) {
      console.error('File read error:', error);
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('write-file', async (event, filePath, data) => {
    console.log('Writing file:', filePath);
    try {
      const fs = require('fs').promises;
      await fs.writeFile(filePath, data, 'utf8');
      return { success: true };
    } catch (error) {
      console.error('File write error:', error);
      return { success: false, error: error.message };
    }
  });

  // File operations
  ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  });
  ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
  });

  // App operations
  ipcMain.handle('minimize', () => mainWindow.minimize());
  ipcMain.handle('maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.handle('close', () => mainWindow.close());
  ipcMain.handle('is-maximized', () => mainWindow.isMaximized());

  // Configuration
  ipcMain.handle('get-config', () => store.get('settings'));
  ipcMain.handle('set-config', (event, config) => store.set('settings', config));

  // Theme
  ipcMain.handle('get-theme', () => store.get('theme', 'dark'));
  ipcMain.handle('set-theme', (event, theme) => {
    nativeTheme.themeSource = theme;
    store.set('theme', theme);
  });

  // Utilities
  ipcMain.handle('open-external', (event, url) => shell.openExternal(url));
  ipcMain.handle('show-item-in-folder', (event, path) => shell.showItemInFolder(path));

  // Development
  ipcMain.handle('open-dev-tools', () => mainWindow.webContents.openDevTools());
  ipcMain.handle('reload', () => mainWindow.webContents.reload());
};

function startLocalServer(config = {}) {
  if (serverProcess) {
    mainWindow.webContents.send('server-status-change', { status: 'already-running' });
    return;
  }

  const serverPath = path.join(__dirname, '../build/mydb_server.exe');
  
  try {
    serverProcess = spawn(serverPath, [], {
      cwd: path.dirname(serverPath)
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
      mainWindow.webContents.send('server-log', data.toString());
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
      mainWindow.webContents.send('server-error', data.toString());
    });

    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      serverProcess = null;
      mainWindow.webContents.send('server-status-change', { status: 'stopped' });
    });

    serverProcess.on('error', (err) => {
      console.error('Failed to start server process:', err);
      serverProcess = null;
      mainWindow.webContents.send('server-status-change', { status: 'error', error: err.message });
    });

    mainWindow.webContents.send('server-status-change', { status: 'started' });
  } catch (error) {
    console.error('Error spawning server process:', error);
    mainWindow.webContents.send('server-status-change', { status: 'error', error: error.message });
  }
}

function stopLocalServer() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    serverProcess = null;
    mainWindow.webContents.send('server-status-change', { status: 'stopped' });
  }
}

app.on('ready', () => {
  console.log('Electron app ready');
  console.log('App version:', app.getVersion());
  console.log('Electron version:', process.versions.electron);
  console.log('Node version:', process.versions.node);
  console.log('Current working directory:', process.cwd());
  
  createWindow();
  setupIpcHandlers();
  
  const theme = store.get('theme', 'dark');
  nativeTheme.themeSource = theme;
  console.log('App initialization complete');
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (serverProcess) {
    console.log('Killing server process');
    serverProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    console.log('Quitting app');
    app.quit();
  }
});

app.on('activate', () => {
  console.log('App activated');
  if (mainWindow === null) {
    console.log('Creating new window');
    createWindow();
  }
});

app.on('before-quit', (event) => {
  console.log('App about to quit');
});

app.on('will-quit', (event) => {
  console.log('App will quit');
});
