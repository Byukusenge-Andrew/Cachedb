import React, { useState } from 'react';
import styled from 'styled-components';
import { FiPlus, FiEdit, FiTrash2, FiWifi, FiServer, FiLock } from 'react-icons/fi';

const ConnectionContainer = styled.div`
  padding: 30px;
  overflow-y: auto;
  height: 100vh;
`;

const ConnectionHeader = styled.div`
  margin-bottom: 30px;
  
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
`;

const ConnectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const ConnectionForm = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  padding: 30px;
  
  h2 {
    font-size: 20px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  
  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: ${props => props.theme.colors.text};
    margin-bottom: 8px;
  }
  
  input, select {
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
    
    &::placeholder {
      color: ${props => props.theme.colors.textSecondary};
    }
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 30px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: ${props => props.theme.borderRadius};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: ${props => props.theme.transition};
  display: flex;
  align-items: center;
  gap: 8px;
  
  &.primary {
    background-color: ${props => props.theme.colors.primary};
    color: white;
    
    &:hover {
      background-color: ${props => props.theme.colors.primary}dd;
    }
  }
  
  &.secondary {
    background-color: transparent;
    color: ${props => props.theme.colors.textSecondary};
    border: 1px solid ${props => props.theme.colors.border};
    
    &:hover {
      background-color: ${props => props.theme.colors.border};
      color: ${props => props.theme.colors.text};
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SavedConnections = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  padding: 30px;
  
  h2 {
    font-size: 20px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 20px;
  }
`;

const ConnectionCard = styled.div`
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  padding: 20px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: ${props => props.theme.transition};
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-1px);
  }
  
  .connection-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    
    .connection-name {
      font-size: 16px;
      font-weight: 600;
      color: ${props => props.theme.colors.text};
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .connection-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .connection-details {
    font-size: 14px;
    color: ${props => props.theme.colors.textSecondary};
    
    .detail-item {
      margin-bottom: 4px;
    }
  }
`;

const ActionButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  background-color: transparent;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: ${props => props.theme.transition};
  
  &:hover {
    background-color: ${props => props.theme.colors.border};
    color: ${props => props.theme.colors.text};
  }
  
  &.danger:hover {
    background-color: ${props => props.theme.colors.danger};
    color: white;
  }
`;

const QuickConnect = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
`;

const QuickConnectCard = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: ${props => props.theme.transition};
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-2px);
  }
  
  .quick-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: ${props => props.color || props.theme.colors.primary};
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 15px;
    color: white;
    font-size: 20px;
  }
  
  .quick-title {
    font-size: 16px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 8px;
  }
  
  .quick-description {
    font-size: 14px;
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const ConnectionManager = ({ onConnect }) => {
  const [connectionForm, setConnectionForm] = useState({
    name: '',
    host: 'localhost',
    port: '6379',
    password: '',
    database: '0',
    ssl: false
  });

  const [savedConnections, setSavedConnections] = useState([
    {
      id: 1,
      name: 'Local Development',
      host: 'localhost',
      port: '6379',
      password: '',
      database: '0',
      ssl: false
    },
    {
      id: 2,
      name: 'Production Server',
      host: 'prod.example.com',
      port: '6379',
      password: '***',
      database: '0',
      ssl: true
    }
  ]);

  const [connecting, setConnecting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConnectionForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleConnect = async (connection = connectionForm) => {
    setConnecting(true);
    try {
      await onConnect(connection);
    } finally {
      setConnecting(false);
    }
  };

  const handleSaveConnection = () => {
    if (!connectionForm.name || !connectionForm.host) return;
    
    const newConnection = {
      ...connectionForm,
      id: Date.now()
    };
    
    setSavedConnections(prev => [...prev, newConnection]);
    setConnectionForm({
      name: '',
      host: 'localhost',
      port: '6379',
      password: '',
      database: '0',
      ssl: false
    });
  };

  const handleDeleteConnection = (id) => {
    setSavedConnections(prev => prev.filter(conn => conn.id !== id));
  };

  const handleEditConnection = (connection) => {
    setConnectionForm(connection);
  };

  const quickConnectOptions = [
    {
      title: 'Local Server',
      description: 'Connect to localhost:6379',
      icon: FiServer,
      color: '#3498db',
      config: { name: 'Local', host: 'localhost', port: '6379', password: '', database: '0', ssl: false }
    },
    {
      title: 'Secure Connection',
      description: 'SSL encrypted connection',
      icon: FiLock,
      color: '#2ecc71',
      config: { name: 'Secure', host: 'localhost', port: '6380', password: '', database: '0', ssl: true }
    }
  ];

  return (
    <ConnectionContainer>
      <ConnectionHeader>
        <h1>Database Connections</h1>
        <p>Connect to your Redis database or manage existing connections</p>
      </ConnectionHeader>

      <QuickConnect>
        {quickConnectOptions.map((option, index) => (
          <QuickConnectCard
            key={index}
            onClick={() => handleConnect(option.config)}
          >
            <div className="quick-icon" style={{ backgroundColor: option.color }}>
              <option.icon />
            </div>
            <div className="quick-title">{option.title}</div>
            <div className="quick-description">{option.description}</div>
          </QuickConnectCard>
        ))}
      </QuickConnect>

      <ConnectionGrid>
        <ConnectionForm>
          <h2>
            <FiPlus size={20} />
            New Connection
          </h2>
          
          <FormGroup>
            <label>Connection Name</label>
            <input
              type="text"
              name="name"
              value={connectionForm.name}
              onChange={handleInputChange}
              placeholder="My Redis Server"
            />
          </FormGroup>

          <FormGroup>
            <label>Host</label>
            <input
              type="text"
              name="host"
              value={connectionForm.host}
              onChange={handleInputChange}
              placeholder="localhost"
            />
          </FormGroup>

          <FormGroup>
            <label>Port</label>
            <input
              type="number"
              name="port"
              value={connectionForm.port}
              onChange={handleInputChange}
              placeholder="6379"
            />
          </FormGroup>

          <FormGroup>
            <label>Password (optional)</label>
            <input
              type="password"
              name="password"
              value={connectionForm.password}
              onChange={handleInputChange}
              placeholder="Enter password"
            />
          </FormGroup>

          <FormGroup>
            <label>Database</label>
            <select
              name="database"
              value={connectionForm.database}
              onChange={handleInputChange}
            >
              {Array.from({ length: 16 }, (_, i) => (
                <option key={i} value={i.toString()}>
                  Database {i}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup>
            <label>
              <input
                type="checkbox"
                name="ssl"
                checked={connectionForm.ssl}
                onChange={handleInputChange}
                style={{ width: 'auto', marginRight: '8px' }}
              />
              Use SSL/TLS
            </label>
          </FormGroup>

          <FormActions>
            <Button 
              className="primary" 
              onClick={() => handleConnect()}
              disabled={connecting || !connectionForm.host}
            >
              <FiWifi size={16} />
              {connecting ? 'Connecting...' : 'Connect'}
            </Button>
            <Button 
              className="secondary" 
              onClick={handleSaveConnection}
              disabled={!connectionForm.name || !connectionForm.host}
            >
              Save Connection
            </Button>
          </FormActions>
        </ConnectionForm>

        <SavedConnections>
          <h2>Saved Connections</h2>
          {savedConnections.length === 0 ? (
            <p style={{ color: '#b0b0b0', textAlign: 'center', padding: '40px 0' }}>
              No saved connections yet
            </p>
          ) : (
            savedConnections.map(connection => (
              <ConnectionCard key={connection.id} onClick={() => handleConnect(connection)}>
                <div className="connection-header">
                  <div className="connection-name">
                    {connection.ssl ? <FiLock size={16} /> : <FiWifi size={16} />}
                    {connection.name}
                  </div>
                  <div className="connection-actions">
                    <ActionButton onClick={(e) => {
                      e.stopPropagation();
                      handleEditConnection(connection);
                    }}>
                      <FiEdit size={14} />
                    </ActionButton>
                    <ActionButton 
                      className="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConnection(connection.id);
                      }}
                    >
                      <FiTrash2 size={14} />
                    </ActionButton>
                  </div>
                </div>
                <div className="connection-details">
                  <div className="detail-item">Host: {connection.host}:{connection.port}</div>
                  <div className="detail-item">Database: {connection.database}</div>
                  {connection.password && <div className="detail-item">Password: ••••••••</div>}
                </div>
              </ConnectionCard>
            ))
          )}
        </SavedConnections>
      </ConnectionGrid>
    </ConnectionContainer>
  );
};

export default ConnectionManager;
