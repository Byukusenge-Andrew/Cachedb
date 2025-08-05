import React from 'react';
import styled from 'styled-components';
import { 
  FiHome, 
  FiDatabase, 
  FiTerminal, 
  FiBarChart2, 
  FiSettings,
  FiWifiOff,
  FiPlay,
  FiSquare,
  FiServer,
  FiUsers,
  FiRadio,
  FiLayers,
  FiCode,
  FiMonitor
} from 'react-icons/fi';

const SidebarContainer = styled.div`
  width: 280px;
  background-color: ${props => props.theme.colors.surface};
  border-right: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

const Logo = styled.div`
  padding: 20px 20px 30px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  flex-shrink: 0;
  
  h1 {
    font-size: 24px;
    font-weight: 700;
    color: ${props => props.theme.colors.primary};
    margin-bottom: 5px;
  }
  
  p {
    font-size: 14px;
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const ConnectionStatus = styled.div`
  padding: 20px 20px 20px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  flex-shrink: 0;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  
  .status-icon {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 10px;
    background-color: ${props => 
      props.status === 'connected' ? props.theme.colors.success : 
      props.status === 'connecting' ? props.theme.colors.warning : 
      props.theme.colors.danger
    };
  }
  
  .status-text {
    font-size: 14px;
    color: ${props => props.theme.colors.text};
    font-weight: 500;
  }
`;

const ServerControls = styled.div`
  display: flex;
  gap: 10px;
`;

const ServerButton = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  background-color: ${props => 
    props.variant === 'start' ? props.theme.colors.success : props.theme.colors.danger
  };
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius};
  font-size: 12px;
  cursor: pointer;
  transition: ${props => props.theme.transition};
  
  &:hover {
    opacity: 0.8;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const NavSection = styled.div`
  padding: 20px 20px 10px;
  
  &:last-child {
    padding-bottom: 30px;
  }
  
  h3 {
    font-size: 12px;
    color: ${props => props.theme.colors.textSecondary};
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 15px;
    font-weight: 600;
  }
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
`;

const NavItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 5px;
  border-radius: ${props => props.theme.borderRadius};
  cursor: pointer;
  transition: ${props => props.theme.transition};
  background-color: ${props => props.active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.active ? 'white' : props.theme.colors.text};
  
  &:hover {
    background-color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.border};
  }
  
  .nav-icon {
    margin-right: 12px;
    font-size: 18px;
  }
  
  .nav-text {
    font-size: 14px;
    font-weight: 500;
  }
`;

const DisconnectButton = styled.button`
  margin: 20px;
  padding: 12px;
  background-color: transparent;
  border: 1px solid ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.textSecondary};
  border-radius: ${props => props.theme.borderRadius};
  cursor: pointer;
  transition: ${props => props.theme.transition};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
  
  &:hover {
    border-color: ${props => props.theme.colors.danger};
    color: ${props => props.theme.colors.danger};
  }
`;

const Sidebar = ({ 
  currentView, 
  onViewChange, 
  connectionStatus,
  serverStatus,
  onDisconnect,
  onStartServer,
  onStopServer
}) => {
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome },
    { id: 'keys', label: 'Key Browser', icon: FiDatabase },
    { id: 'cli', label: 'Redis CLI', icon: FiTerminal },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart2 },
  ];

  const clusterItems = [
    { id: 'cluster', label: 'Cluster Manager', icon: FiUsers },
    { id: 'pubsub', label: 'Pub/Sub Monitor', icon: FiRadio },
  ];

  const toolItems = [
    { id: 'config', label: 'Configuration', icon: FiLayers },
    { id: 'client', label: 'Client SDKs', icon: FiCode },
    { id: 'monitor', label: 'System Monitor', icon: FiMonitor },
    { id: 'settings', label: 'Settings', icon: FiSettings },
  ];

  return (
    <SidebarContainer>
      <Logo>
        <h1>CacheDB</h1>
        <p>Desktop Management Tool</p>
      </Logo>

      <ConnectionStatus>
        <StatusIndicator status={connectionStatus}>
          <div className="status-icon" />
          <span className="status-text">
            {connectionStatus === 'connected' ? 'Connected' : 
             connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </span>
        </StatusIndicator>
        
        <StatusIndicator status={serverStatus === 'started' ? 'connected' : 'disconnected'}>
          <FiServer style={{ marginRight: '10px', fontSize: '16px' }} />
          <span className="status-text">
            Local Server: {serverStatus === 'started' ? 'Running' : 'Stopped'}
          </span>
        </StatusIndicator>

        <ServerControls>
          <ServerButton
            variant="start"
            onClick={onStartServer}
            disabled={serverStatus === 'started'}
          >
            <FiPlay size={12} />
            Start
          </ServerButton>
          <ServerButton
            variant="stop"
            onClick={onStopServer}
            disabled={serverStatus !== 'started'}
          >
            <FiSquare size={12} />
            Stop
          </ServerButton>
        </ServerControls>
      </ConnectionStatus>

      <ScrollableContent>
        <NavSection>
          <h3>Database</h3>
          {navigationItems.map(item => (
            <NavItem
              key={item.id}
              active={currentView === item.id}
              onClick={() => onViewChange(item.id)}
            >
              <item.icon className="nav-icon" />
              <span className="nav-text">{item.label}</span>
            </NavItem>
          ))}
        </NavSection>

        <NavSection>
          <h3>Cluster</h3>
          {clusterItems.map(item => (
            <NavItem
              key={item.id}
              active={currentView === item.id}
              onClick={() => onViewChange(item.id)}
            >
              <item.icon className="nav-icon" />
              <span className="nav-text">{item.label}</span>
            </NavItem>
          ))}
        </NavSection>

        <NavSection>
          <h3>Tools</h3>
          {toolItems.map(item => (
            <NavItem
              key={item.id}
              active={currentView === item.id}
              onClick={() => onViewChange(item.id)}
            >
              <item.icon className="nav-icon" />
              <span className="nav-text">{item.label}</span>
            </NavItem>
          ))}
        </NavSection>
      </ScrollableContent>

      {connectionStatus === 'connected' && (
        <DisconnectButton onClick={onDisconnect}>
          <FiWifiOff size={16} />
          Disconnect
        </DisconnectButton>
      )}
    </SidebarContainer>
  );
};

export default Sidebar;
