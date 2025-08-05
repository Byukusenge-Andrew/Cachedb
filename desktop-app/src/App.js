import React, { useState, useEffect } from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { BrowserRouter as Router } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import KeyBrowser from './components/KeyBrowser';
import CLI from './components/CLI';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import ConnectionManager from './components/ConnectionManager';
import ClusterManager from './components/ClusterManager';
import ConfigManager from './components/ConfigManager';
import PubSubMonitor from './components/PubSubMonitor';
import ClientSDK from './components/ClientSDK';
import SystemMonitor from './components/SystemMonitor';
import LoadingSpinner from './components/LoadingSpinner';
import { ToastProvider, useToast } from './components/Toast';

const theme = {
  colors: {
    primary: '#3498db',
    secondary: '#2c3e50',
    success: '#27ae60',
    warning: '#f39c12',
    danger: '#e74c3c',
    info: '#3498db',
    dark: '#2c3e50',
    light: '#ecf0f1',
    background: '#1a1a1a',
    surface: '#2d2d2d',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    border: '#404040',
    accent: '#e67e22'
  },
  fonts: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace'
  },
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease'
};

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${props => props.theme.fonts.primary};
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
    overflow: hidden; /* Keep this for Electron app to prevent outer scrolling */
  }

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.surface};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.colors.primary};
  }
`;

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: ${props => props.theme.colors.background};
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [serverStatus, setServerStatus] = useState('stopped');
  const [currentConnection, setCurrentConnection] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Set up Electron API event listeners
    if (window.electronAPI) {
      const removeMenuListener = window.electronAPI.onMenuAction((event, action) => {
        switch (action) {
          case 'new-connection':
            setCurrentView('connection');
            break;
          case 'import-data':
            handleImportData();
            break;
          case 'export-data':
            handleExportData();
            break;
          case 'flush-db':
            handleFlushDatabase();
            break;
          case 'show-stats':
            setCurrentView('analytics');
            break;
          case 'open-cli':
            setCurrentView('cli');
            break;
          case 'settings':
            setCurrentView('settings');
            break;
          default:
            break;
        }
      });

      const removeServerStatusListener = window.electronAPI.onServerStatusChange((event, status) => {
        setServerStatus(status.status);
        if (status.status === 'started') {
          toast.success('Local Server Started', 'The local database server has started successfully.');
        } else if (status.status === 'stopped') {
          toast.info('Local Server Stopped', 'The local database server has been stopped.');
        } else if (status.status === 'error') {
          toast.error('Server Error', `An error occurred with the local server: ${status.error}`);
        }
      });

      return () => {
        // Cleanup listeners
        removeMenuListener();
        removeServerStatusListener();
      };
    }
  }, [toast]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = async (connectionConfig) => {
    setLoading(true);
    try {
      await window.electronAPI.connectToDatabase(connectionConfig);
      setCurrentConnection(connectionConfig);
      setConnectionStatus('connected');
      setCurrentView('dashboard');
      toast.success('Connection Successful', `Connected to ${connectionConfig.name}`);
    } catch (error) {
      toast.error('Connection Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await window.electronAPI.disconnectFromDatabase();
      setCurrentConnection(null);
      setConnectionStatus('disconnected');
      toast.info('Disconnected', 'Successfully disconnected from the database.');
    } catch (error) {
      toast.error('Disconnection Failed', error.message);
    }
  };

  const handleImportData = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.importData();
      if (result.success) {
        toast.success('Import Successful', `Imported data from ${result.filePath}`);
      } else if (result.error) {
        toast.error('Import Failed', result.error);
      }
    } catch (error) {
      toast.error('Import Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.exportData();
      if (result.success) {
        toast.success('Export Successful', `Exported data to ${result.filePath}`);
      } else if (result.error) {
        toast.error('Export Failed', result.error);
      }
    } catch (error) {
      toast.error('Export Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFlushDatabase = async () => {
    if (window.confirm('Are you sure you want to flush the entire database? This cannot be undone.')) {
      setLoading(true);
      try {
        await window.electronAPI.executeCommand('FLUSHDB');
        toast.success('Database Flushed', 'All keys have been removed from the current database.');
      } catch (error)
      {
        toast.error('Flush Failed', error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const startLocalServer = async () => {
    if (window.electronAPI) {
      await window.electronAPI.startServer();
    }
  };

  const stopLocalServer = async () => {
    if (window.electronAPI) {
      await window.electronAPI.stopServer();
    }
  };

  const renderCurrentView = () => {
    if (connectionStatus === 'disconnected' && currentView !== 'connection' && currentView !== 'settings') {
      return <ConnectionManager onConnect={handleConnect} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard connection={currentConnection} />;
      case 'keys':
        return <KeyBrowser connection={currentConnection} />;
      case 'cli':
        return <CLI isConnected={connectionStatus === 'connected'} />;
      case 'analytics':
        return <Analytics connection={currentConnection} />;
      case 'cluster':
        return <ClusterManager connection={currentConnection} />;
      case 'config':
        return <ConfigManager connection={currentConnection} />;
      case 'pubsub':
        return <PubSubMonitor connection={currentConnection} />;
      case 'client':
        return <ClientSDK />;
      case 'monitor':
        return <SystemMonitor />;
      case 'settings':
        return <Settings />;
      case 'connection':
        return <ConnectionManager onConnect={handleConnect} />;
      default:
        return <Dashboard connection={currentConnection} />;
    }
  };

  return (
    <AppContainer>
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        connectionStatus={connectionStatus}
        serverStatus={serverStatus}
        onDisconnect={handleDisconnect}
        onStartServer={startLocalServer}
        onStopServer={stopLocalServer}
      />
      <MainContent>
        {renderCurrentView()}
      </MainContent>
      {loading && <LoadingSpinner overlay text="Processing..." />}
    </AppContainer>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <ToastProvider>
        <Router>
          <AppContent />
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
