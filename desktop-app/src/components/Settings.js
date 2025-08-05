import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  FiSettings, FiLock, FiDatabase, FiMonitor,
  FiSave, FiRotateCcw, FiDownload, FiUpload,
  FiEye
} from 'react-icons/fi';

const SettingsContainer = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  height: 100vh;
  background-color: ${props => props.theme.colors.background};
`;

const SettingsSidebar = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border-right: 1px solid ${props => props.theme.colors.border};
  padding: 30px 0;
`;

const SidebarHeader = styled.div`
  padding: 0 30px 20px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  h2 {
    font-size: 20px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

const NavMenu = styled.div`
  padding: 20px 0;
`;

const NavItem = styled.div`
  padding: 12px 30px;
  cursor: pointer;
  transition: ${props => props.theme.transition};
  border-left: 3px solid transparent;
  
  &:hover {
    background-color: ${props => props.theme.colors.border};
  }
  
  &.active {
    background-color: ${props => props.theme.colors.primary}10;
    border-left-color: ${props => props.theme.colors.primary};
    
    .nav-text {
      color: ${props => props.theme.colors.primary};
    }
  }
  
  .nav-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .nav-text {
    font-size: 14px;
    font-weight: 500;
    color: ${props => props.theme.colors.text};
  }
  
  .nav-description {
    font-size: 12px;
    color: ${props => props.theme.colors.textSecondary};
    margin-top: 4px;
  }
`;

const SettingsContent = styled.div`
  padding: 30px;
  overflow-y: auto;
`;

const ContentHeader = styled.div`
  margin-bottom: 30px;
  
  h1 {
    font-size: 24px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 8px;
  }
  
  p {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 16px;
  }
`;

const SettingsGroup = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  margin-bottom: 24px;
  overflow: hidden;
  
  .group-header {
    padding: 20px 24px;
    border-bottom: 1px solid ${props => props.theme.colors.border};
    
    h3 {
      font-size: 16px;
      font-weight: 600;
      color: ${props => props.theme.colors.text};
      margin: 0 0 4px 0;
    }
    
    p {
      font-size: 14px;
      color: ${props => props.theme.colors.textSecondary};
      margin: 0;
    }
  }
  
  .group-content {
    padding: 24px;
  }
`;

const FormField = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: ${props => props.theme.colors.text};
    margin-bottom: 8px;
  }
  
  input, select, textarea {
    width: 100%;
    padding: 12px 16px;
    background-color: ${props => props.theme.colors.background};
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius};
    color: ${props => props.theme.colors.text};
    font-size: 14px;
    transition: ${props => props.theme.transition};
    
    &:focus {
      outline: none;
      border-color: ${props => props.theme.colors.primary};
      box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}20;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  textarea {
    min-height: 100px;
    resize: vertical;
  }
  
  .field-description {
    font-size: 12px;
    color: ${props => props.theme.colors.textSecondary};
    margin-top: 6px;
  }
`;

const ToggleField = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  
  .toggle-info {
    flex: 1;
    
    h4 {
      font-size: 14px;
      font-weight: 500;
      color: ${props => props.theme.colors.text};
      margin: 0 0 4px 0;
    }
    
    p {
      font-size: 12px;
      color: ${props => props.theme.colors.textSecondary};
      margin: 0;
    }
  }
`;

const Toggle = styled.div`
  position: relative;
  width: 48px;
  height: 24px;
  background-color: ${props => props.checked ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: 12px;
  cursor: pointer;
  transition: ${props => props.theme.transition};
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.checked ? '26px' : '2px'};
    width: 20px;
    height: 20px;
    background-color: white;
    border-radius: 50%;
    transition: ${props => props.theme.transition};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const Button = styled.button`
  padding: 10px 20px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  background-color: transparent;
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  transition: ${props => props.theme.transition};
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  
  &:hover {
    background-color: ${props => props.theme.colors.border};
  }
  
  &.primary {
    background-color: ${props => props.theme.colors.primary};
    color: white;
    border-color: ${props => props.theme.colors.primary};
    
    &:hover {
      background-color: ${props => props.theme.colors.primary}dd;
    }
  }
  
  &.danger {
    background-color: ${props => props.theme.colors.danger};
    color: white;
    border-color: ${props => props.theme.colors.danger};
    
    &:hover {
      background-color: ${props => props.theme.colors.danger}dd;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Settings = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState({
    // General settings
    appName: 'MyRedis Desktop',
    theme: 'dark',
    language: 'en',
    autoSave: true,
    confirmDeletes: true,
    
    // Connection settings
    defaultHost: 'localhost',
    defaultPort: '6379',
    connectionTimeout: '5000',
    maxRetries: '3',
    keepAlive: true,
    
    // Security settings
    requireAuth: false,
    sessionTimeout: '3600',
    encryptConnections: true,
    logSecurityEvents: true,
    
    // Performance settings
    maxConnections: '100',
    cacheSize: '1000',
    refreshInterval: '5000',
    enableOptimizations: true,
    
    // Display settings
    keysPerPage: '50',
    maxValueLength: '1000',
    showDataTypes: true,
    highlightSyntax: true
  });

  const menuItems = [
    {
      id: 'general',
      icon: FiSettings,
      title: 'General',
      description: 'Application preferences'
    },
    {
      id: 'connections',
      icon: FiDatabase,
      title: 'Connections',
      description: 'Default connection settings'
    },
    {
      id: 'security',
      icon: FiLock,
      title: 'Security',
      description: 'Authentication and encryption'
    },
    {
      id: 'performance',
      icon: FiMonitor,
      title: 'Performance',
      description: 'Optimization settings'
    },
    {
      id: 'display',
      icon: FiEye,
      title: 'Display',
      description: 'UI and visualization options'
    }
  ];

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    // Save settings to localStorage or send to backend
    localStorage.setItem('myredis-settings', JSON.stringify(settings));
    // Show success message
  };

  const handleReset = () => {
    // Reset to default settings
    setSettings({
      appName: 'MyRedis Desktop',
      theme: 'dark',
      language: 'en',
      autoSave: true,
      confirmDeletes: true,
      defaultHost: 'localhost',
      defaultPort: '6379',
      connectionTimeout: '5000',
      maxRetries: '3',
      keepAlive: true,
      requireAuth: false,
      sessionTimeout: '3600',
      encryptConnections: true,
      logSecurityEvents: true,
      maxConnections: '100',
      cacheSize: '1000',
      refreshInterval: '5000',
      enableOptimizations: true,
      keysPerPage: '50',
      maxValueLength: '1000',
      showDataTypes: true,
      highlightSyntax: true
    });
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <>
            <SettingsGroup>
              <div className="group-header">
                <h3>Application Settings</h3>
                <p>Basic application preferences and behavior</p>
              </div>
              <div className="group-content">
                <FormField>
                  <label>Application Name</label>
                  <input
                    type="text"
                    value={settings.appName}
                    onChange={(e) => handleSettingChange('appName', e.target.value)}
                  />
                </FormField>
                
                <FormField>
                  <label>Theme</label>
                  <select
                    value={settings.theme}
                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </FormField>
                
                <FormField>
                  <label>Language</label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </FormField>
              </div>
            </SettingsGroup>

            <SettingsGroup>
              <div className="group-header">
                <h3>Behavior</h3>
                <p>Control how the application behaves</p>
              </div>
              <div className="group-content">
                <ToggleField>
                  <div className="toggle-info">
                    <h4>Auto Save</h4>
                    <p>Automatically save changes without confirmation</p>
                  </div>
                  <Toggle
                    checked={settings.autoSave}
                    onClick={() => handleToggle('autoSave')}
                  />
                </ToggleField>
                
                <ToggleField>
                  <div className="toggle-info">
                    <h4>Confirm Deletes</h4>
                    <p>Show confirmation dialog before deleting keys</p>
                  </div>
                  <Toggle
                    checked={settings.confirmDeletes}
                    onClick={() => handleToggle('confirmDeletes')}
                  />
                </ToggleField>
              </div>
            </SettingsGroup>
          </>
        );

      case 'connections':
        return (
          <SettingsGroup>
            <div className="group-header">
              <h3>Default Connection Settings</h3>
              <p>These settings will be used for new connections</p>
            </div>
            <div className="group-content">
              <FormField>
                <label>Default Host</label>
                <input
                  type="text"
                  value={settings.defaultHost}
                  onChange={(e) => handleSettingChange('defaultHost', e.target.value)}
                />
              </FormField>
              
              <FormField>
                <label>Default Port</label>
                <input
                  type="number"
                  value={settings.defaultPort}
                  onChange={(e) => handleSettingChange('defaultPort', e.target.value)}
                />
              </FormField>
              
              <FormField>
                <label>Connection Timeout (ms)</label>
                <input
                  type="number"
                  value={settings.connectionTimeout}
                  onChange={(e) => handleSettingChange('connectionTimeout', e.target.value)}
                />
                <div className="field-description">
                  Time to wait before timing out connection attempts
                </div>
              </FormField>
              
              <FormField>
                <label>Max Retries</label>
                <input
                  type="number"
                  value={settings.maxRetries}
                  onChange={(e) => handleSettingChange('maxRetries', e.target.value)}
                />
              </FormField>
              
              <ToggleField>
                <div className="toggle-info">
                  <h4>Keep Alive</h4>
                  <p>Send periodic pings to maintain connection</p>
                </div>
                <Toggle
                  checked={settings.keepAlive}
                  onClick={() => handleToggle('keepAlive')}
                />
              </ToggleField>
            </div>
          </SettingsGroup>
        );

      case 'security':
        return (
          <>
            <SettingsGroup>
              <div className="group-header">
                <h3>Authentication</h3>
                <p>Configure authentication requirements</p>
              </div>
              <div className="group-content">
                <ToggleField>
                  <div className="toggle-info">
                    <h4>Require Authentication</h4>
                    <p>Require password for all connections</p>
                  </div>
                  <Toggle
                    checked={settings.requireAuth}
                    onClick={() => handleToggle('requireAuth')}
                  />
                </ToggleField>
                
                <FormField>
                  <label>Session Timeout (seconds)</label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
                  />
                </FormField>
              </div>
            </SettingsGroup>

            <SettingsGroup>
              <div className="group-header">
                <h3>Encryption</h3>
                <p>Configure data encryption settings</p>
              </div>
              <div className="group-content">
                <ToggleField>
                  <div className="toggle-info">
                    <h4>Encrypt Connections</h4>
                    <p>Use SSL/TLS for secure connections</p>
                  </div>
                  <Toggle
                    checked={settings.encryptConnections}
                    onClick={() => handleToggle('encryptConnections')}
                  />
                </ToggleField>
                
                <ToggleField>
                  <div className="toggle-info">
                    <h4>Log Security Events</h4>
                    <p>Record authentication and connection events</p>
                  </div>
                  <Toggle
                    checked={settings.logSecurityEvents}
                    onClick={() => handleToggle('logSecurityEvents')}
                  />
                </ToggleField>
              </div>
            </SettingsGroup>
          </>
        );

      case 'performance':
        return (
          <SettingsGroup>
            <div className="group-header">
              <h3>Performance Optimization</h3>
              <p>Configure performance and resource usage</p>
            </div>
            <div className="group-content">
              <FormField>
                <label>Max Connections</label>
                <input
                  type="number"
                  value={settings.maxConnections}
                  onChange={(e) => handleSettingChange('maxConnections', e.target.value)}
                />
              </FormField>
              
              <FormField>
                <label>Cache Size (MB)</label>
                <input
                  type="number"
                  value={settings.cacheSize}
                  onChange={(e) => handleSettingChange('cacheSize', e.target.value)}
                />
              </FormField>
              
              <FormField>
                <label>Refresh Interval (ms)</label>
                <input
                  type="number"
                  value={settings.refreshInterval}
                  onChange={(e) => handleSettingChange('refreshInterval', e.target.value)}
                />
              </FormField>
              
              <ToggleField>
                <div className="toggle-info">
                  <h4>Enable Optimizations</h4>
                  <p>Use advanced performance optimizations</p>
                </div>
                <Toggle
                  checked={settings.enableOptimizations}
                  onClick={() => handleToggle('enableOptimizations')}
                />
              </ToggleField>
            </div>
          </SettingsGroup>
        );

      case 'display':
        return (
          <SettingsGroup>
            <div className="group-header">
              <h3>Display Options</h3>
              <p>Customize how data is displayed</p>
            </div>
            <div className="group-content">
              <FormField>
                <label>Keys Per Page</label>
                <select
                  value={settings.keysPerPage}
                  onChange={(e) => handleSettingChange('keysPerPage', e.target.value)}
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                </select>
              </FormField>
              
              <FormField>
                <label>Max Value Length</label>
                <input
                  type="number"
                  value={settings.maxValueLength}
                  onChange={(e) => handleSettingChange('maxValueLength', e.target.value)}
                />
                <div className="field-description">
                  Maximum characters to display for large values
                </div>
              </FormField>
              
              <ToggleField>
                <div className="toggle-info">
                  <h4>Show Data Types</h4>
                  <p>Display data type icons in key lists</p>
                </div>
                <Toggle
                  checked={settings.showDataTypes}
                  onClick={() => handleToggle('showDataTypes')}
                />
              </ToggleField>
              
              <ToggleField>
                <div className="toggle-info">
                  <h4>Syntax Highlighting</h4>
                  <p>Enable syntax highlighting for JSON and other formats</p>
                </div>
                <Toggle
                  checked={settings.highlightSyntax}
                  onClick={() => handleToggle('highlightSyntax')}
                />
              </ToggleField>
            </div>
          </SettingsGroup>
        );

      default:
        return null;
    }
  };

  return (
    <SettingsContainer>
      <SettingsSidebar>
        <SidebarHeader>
          <h2>
            <FiSettings size={20} />
            Settings
          </h2>
        </SidebarHeader>
        
        <NavMenu>
          {menuItems.map(item => (
            <NavItem
              key={item.id}
              className={activeSection === item.id ? 'active' : ''}
              onClick={() => setActiveSection(item.id)}
            >
              <div className="nav-content">
                <item.icon size={16} />
                <div>
                  <div className="nav-text">{item.title}</div>
                  <div className="nav-description">{item.description}</div>
                </div>
              </div>
            </NavItem>
          ))}
        </NavMenu>
      </SettingsSidebar>

      <SettingsContent>
        <ContentHeader>
          <h1>{menuItems.find(item => item.id === activeSection)?.title}</h1>
          <p>{menuItems.find(item => item.id === activeSection)?.description}</p>
        </ContentHeader>

        {renderContent()}

        <ButtonGroup>
          <Button className="primary" onClick={handleSave}>
            <FiSave size={16} />
            Save Settings
          </Button>
          <Button onClick={handleReset}>
            <FiRotateCcw size={16} />
            Reset to Defaults
          </Button>
          <Button>
            <FiDownload size={16} />
            Export Settings
          </Button>
          <Button>
            <FiUpload size={16} />
            Import Settings
          </Button>
        </ButtonGroup>
      </SettingsContent>
    </SettingsContainer>
  );
};

export default Settings;
