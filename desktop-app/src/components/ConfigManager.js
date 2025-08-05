import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiSettings, FiSave, FiRefreshCw, FiUpload, FiDownload,
  FiDatabase, FiShield, FiClock, FiHardDrive, FiCpu,
  FiEdit, FiCheck, FiX, FiInfo, FiAlertTriangle
} from 'react-icons/fi';

const ConfigContainer = styled.div`
  padding: 30px;
  overflow-y: auto;
  height: 100vh;
  background-color: ${props => props.theme.colors.background};
`;

const ConfigHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  
  .header-left {
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: ${props => props.theme.colors.text};
      margin-bottom: 8px;
    }
    
    p {
      color: ${props => props.theme.colors.textSecondary};
      font-size: 16px;
    }
  }
  
  .header-actions {
    display: flex;
    gap: 12px;
  }
`;

const ActionButton = styled.button`
  padding: 10px 16px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  background-color: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  transition: ${props => props.theme.transition};
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.theme.colors.border};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.primary {
    background-color: ${props => props.theme.colors.primary};
    color: white;
    border-color: ${props => props.theme.colors.primary};
    
    &:hover:not(:disabled) {
      background-color: ${props => props.theme.colors.primary}dd;
    }
  }
`;

const ConfigSections = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
  height: calc(100vh - 150px);
`;

const SectionsList = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  padding: 20px;
  height: fit-content;
  
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 16px;
  }
`;

const SectionItem = styled.div`
  padding: 12px 16px;
  border-radius: ${props => props.theme.borderRadius};
  cursor: pointer;
  transition: ${props => props.theme.transition};
  background-color: ${props => props.active ? props.theme.colors.primary + '20' : 'transparent'};
  border: 1px solid ${props => props.active ? props.theme.colors.primary : 'transparent'};
  margin-bottom: 8px;
  
  &:hover {
    background-color: ${props => props.theme.colors.background};
  }
  
  .section-title {
    font-size: 14px;
    font-weight: 500;
    color: ${props => props.theme.colors.text};
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .section-description {
    font-size: 12px;
    color: ${props => props.theme.colors.textSecondary};
    margin-top: 4px;
  }
`;

const ConfigPanel = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  padding: 30px;
  height: fit-content;
  
  .panel-header {
    margin-bottom: 24px;
    
    h2 {
      font-size: 20px;
      font-weight: 600;
      color: ${props => props.theme.colors.text};
      margin-bottom: 8px;
    }
    
    p {
      font-size: 14px;
      color: ${props => props.theme.colors.textSecondary};
    }
  }
`;

const ConfigGroup = styled.div`
  margin-bottom: 24px;
  
  .group-title {
    font-size: 16px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const ConfigItem = styled.div`
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  
  .config-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    
    .config-name {
      font-size: 14px;
      font-weight: 500;
      color: ${props => props.theme.colors.text};
    }
    
    .config-actions {
      display: flex;
      gap: 4px;
    }
  }
  
  .config-description {
    font-size: 12px;
    color: ${props => props.theme.colors.textSecondary};
    margin-bottom: 12px;
  }
  
  .config-input {
    display: flex;
    align-items: center;
    gap: 12px;
    
    input, select {
      flex: 1;
      padding: 8px 12px;
      background-color: ${props => props.theme.colors.background};
      border: 1px solid ${props => props.theme.colors.border};
      border-radius: ${props => props.theme.borderRadius};
      color: ${props => props.theme.colors.text};
      font-size: 14px;
      
      &:focus {
        outline: none;
        border-color: ${props => props.theme.colors.primary};
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
    
    .unit {
      font-size: 12px;
      color: ${props => props.theme.colors.textSecondary};
      min-width: 40px;
    }
  }
`;

const ConfigManager = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [config, setConfig] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const sections = [
    {
      id: 'general',
      title: 'General',
      description: 'Basic database settings',
      icon: FiDatabase
    },
    {
      id: 'memory',
      title: 'Memory',
      description: 'Memory management options',
      icon: FiHardDrive
    },
    {
      id: 'performance',
      title: 'Performance',
      description: 'Performance optimization',
      icon: FiCpu
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Authentication and encryption',
      icon: FiShield
    },
    {
      id: 'persistence',
      title: 'Persistence',
      description: 'Data persistence settings',
      icon: FiClock
    }
  ];

  const configOptions = {
    general: {
      title: 'General Settings',
      description: 'Basic database configuration options',
      groups: [
        {
          title: 'Server Configuration',
          items: [
            {
              name: 'port',
              label: 'Port',
              description: 'Port number for the database server',
              type: 'number',
              value: 6379,
              unit: ''
            },
            {
              name: 'bind',
              label: 'Bind Address',
              description: 'IP address to bind the server to',
              type: 'text',
              value: '127.0.0.1',
              unit: ''
            },
            {
              name: 'timeout',
              label: 'Client Timeout',
              description: 'Client connection timeout in seconds',
              type: 'number',
              value: 300,
              unit: 'seconds'
            }
          ]
        }
      ]
    },
    memory: {
      title: 'Memory Management',
      description: 'Configure memory usage and allocation',
      groups: [
        {
          title: 'Memory Limits',
          items: [
            {
              name: 'maxmemory',
              label: 'Max Memory',
              description: 'Maximum memory usage limit',
              type: 'text',
              value: '2gb',
              unit: ''
            },
            {
              name: 'maxmemory-policy',
              label: 'Eviction Policy',
              description: 'Policy for evicting keys when memory limit is reached',
              type: 'select',
              value: 'allkeys-lru',
              options: [
                'noeviction',
                'allkeys-lru',
                'allkeys-lfu',
                'volatile-lru',
                'volatile-lfu',
                'allkeys-random',
                'volatile-random',
                'volatile-ttl'
              ],
              unit: ''
            }
          ]
        },
        {
          title: 'Cache Settings',
          items: [
            {
              name: 'cache-size',
              label: 'Cache Size',
              description: 'Size of the cache in megabytes',
              type: 'number',
              value: 1024,
              unit: 'MB'
            }
          ]
        }
      ]
    },
    performance: {
      title: 'Performance Settings',
      description: 'Optimize database performance',
      groups: [
        {
          title: 'Threading',
          items: [
            {
              name: 'threads',
              label: 'Worker Threads',
              description: 'Number of worker threads for processing requests',
              type: 'number',
              value: 4,
              unit: ''
            }
          ]
        }
      ]
    },
    security: {
      title: 'Security Settings',
      description: 'Configure authentication and security',
      groups: [
        {
          title: 'Authentication',
          items: [
            {
              name: 'requirepass',
              label: 'Password',
              description: 'Require password for connections',
              type: 'password',
              value: '',
              unit: ''
            }
          ]
        }
      ]
    },
    persistence: {
      title: 'Persistence Settings',
      description: 'Configure data persistence options',
      groups: [
        {
          title: 'Snapshotting',
          items: [
            {
              name: 'save-interval',
              label: 'Save Interval',
              description: 'Automatic save interval in seconds',
              type: 'number',
              value: 900,
              unit: 'seconds'
            }
          ]
        }
      ]
    }
  };

  const fetchConfig = async () => {
    try {
      // Try to get config from database
      if (window.electronAPI) {
        const response = await window.electronAPI.executeCommand('CONFIG', ['GET', '*']);
        if (response.success) {
          console.log('Config:', response.result);
        }
      }
      
      // For now, use default config
      setConfig(configOptions);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching config:', error);
      setConfig(configOptions);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save configuration to database
      console.log('Saving configuration...');
      // Implementation would go here
      
      setTimeout(() => setSaving(false), 1000);
    } catch (error) {
      console.error('Error saving config:', error);
      setSaving(false);
    }
  };

  const handleConfigChange = (section, group, item, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        groups: prev[section].groups.map(g => 
          g.title === group ? {
            ...g,
            items: g.items.map(i => 
              i.name === item ? { ...i, value } : i
            )
          } : g
        )
      }
    }));
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const renderConfigItem = (section, group, item) => (
    <ConfigItem key={item.name}>
      <div className="config-header">
        <span className="config-name">{item.label}</span>
        <div className="config-actions">
          <ActionButton>
            <FiInfo size={12} />
          </ActionButton>
        </div>
      </div>
      <div className="config-description">{item.description}</div>
      <div className="config-input">
        {item.type === 'select' ? (
          <select
            value={item.value}
            onChange={(e) => handleConfigChange(section, group.title, item.name, e.target.value)}
          >
            {item.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            type={item.type}
            value={item.value}
            onChange={(e) => handleConfigChange(section, group.title, item.name, e.target.value)}
            placeholder={item.type === 'password' ? '••••••••' : ''}
          />
        )}
        {item.unit && <span className="unit">{item.unit}</span>}
      </div>
    </ConfigItem>
  );

  return (
    <ConfigContainer>
      <ConfigHeader>
        <div className="header-left">
          <h1>Configuration</h1>
          <p>Manage database settings and parameters</p>
        </div>
        
        <div className="header-actions">
          <ActionButton onClick={fetchConfig} disabled={loading}>
            <FiRefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </ActionButton>
          <ActionButton>
            <FiUpload size={16} />
            Import
          </ActionButton>
          <ActionButton>
            <FiDownload size={16} />
            Export
          </ActionButton>
          <ActionButton onClick={handleSave} disabled={saving} className="primary">
            <FiSave size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </ActionButton>
        </div>
      </ConfigHeader>

      <ConfigSections>
        <SectionsList>
          <h3>Configuration Sections</h3>
          {sections.map(section => (
            <SectionItem
              key={section.id}
              active={activeSection === section.id}
              onClick={() => setActiveSection(section.id)}
            >
              <div className="section-title">
                {React.createElement(section.icon, { size: 16 })}
                {section.title}
              </div>
              <div className="section-description">{section.description}</div>
            </SectionItem>
          ))}
        </SectionsList>

        <ConfigPanel>
          {config[activeSection] && (
            <>
              <div className="panel-header">
                <h2>{config[activeSection].title}</h2>
                <p>{config[activeSection].description}</p>
              </div>

              {config[activeSection].groups?.map(group => (
                <ConfigGroup key={group.title}>
                  <div className="group-title">
                    <FiSettings size={16} />
                    {group.title}
                  </div>
                  {group.items.map(item => renderConfigItem(activeSection, group, item))}
                </ConfigGroup>
              ))}
            </>
          )}
        </ConfigPanel>
      </ConfigSections>
    </ConfigContainer>
  );
};

export default ConfigManager;
