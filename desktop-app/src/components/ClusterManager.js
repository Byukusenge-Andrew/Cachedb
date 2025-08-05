import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiServer, FiPlus, FiTrash2, FiRefreshCw, FiEdit,
  FiCheck, FiX, FiActivity, FiCpu, FiHardDrive,
  FiWifi, FiWifiOff, FiSettings, FiInfo, FiAlertTriangle
} from 'react-icons/fi';

const ClusterContainer = styled.div`
  padding: 30px;
  overflow-y: auto;
  height: 100vh;
  background-color: ${props => props.theme.colors.background};
`;

const ClusterHeader = styled.div`
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
  
  &.danger {
    background-color: ${props => props.theme.colors.danger};
    color: white;
    border-color: ${props => props.theme.colors.danger};
    
    &:hover:not(:disabled) {
      background-color: ${props => props.theme.colors.danger}dd;
    }
  }
`;

const ClusterOverview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const OverviewCard = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  padding: 24px;
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    
    .icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: ${props => props.color}20;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${props => props.color};
    }
    
    h3 {
      font-size: 16px;
      font-weight: 600;
      color: ${props => props.theme.colors.text};
      margin: 0;
    }
  }
  
  .card-value {
    font-size: 24px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 8px;
  }
  
  .card-description {
    font-size: 14px;
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const NodesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const NodeCard = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  padding: 20px;
  
  .node-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    
    .node-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .status-icon {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: ${props => props.status === 'healthy' ? '#2ecc71' : 
                                    props.status === 'warning' ? '#f39c12' : '#e74c3c'};
      }
      
      h4 {
        font-size: 16px;
        font-weight: 600;
        color: ${props => props.theme.colors.text};
        margin: 0;
      }
      
      .role {
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 12px;
        background-color: ${props => props.theme.colors.primary}20;
        color: ${props => props.theme.colors.primary};
        text-transform: uppercase;
        font-weight: 600;
      }
    }
    
    .node-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .node-details {
    margin-bottom: 16px;
    
    .detail-row {
      display: flex;
      justify-content: between;
      align-items: center;
      margin-bottom: 8px;
      
      .label {
        font-size: 12px;
        color: ${props => props.theme.colors.textSecondary};
        text-transform: uppercase;
        font-weight: 600;
        width: 80px;
      }
      
      .value {
        font-size: 14px;
        color: ${props => props.theme.colors.text};
        font-weight: 500;
      }
    }
  }
  
  .node-metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    
    .metric {
      text-align: center;
      
      .metric-value {
        font-size: 18px;
        font-weight: 700;
        color: ${props => props.theme.colors.text};
      }
      
      .metric-label {
        font-size: 11px;
        color: ${props => props.theme.colors.textSecondary};
        text-transform: uppercase;
        font-weight: 600;
      }
    }
  }
`;

const AddNodeModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  
  .modal-content {
    background-color: ${props => props.theme.colors.surface};
    border-radius: ${props => props.theme.borderRadius};
    padding: 30px;
    width: 400px;
    max-width: 90vw;
    
    h3 {
      font-size: 20px;
      font-weight: 600;
      color: ${props => props.theme.colors.text};
      margin-bottom: 20px;
    }
    
    .form-group {
      margin-bottom: 20px;
      
      label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: ${props => props.theme.colors.text};
        margin-bottom: 6px;
      }
      
      input, select {
        width: 100%;
        padding: 10px 12px;
        background-color: ${props => props.theme.colors.background};
        border: 1px solid ${props => props.theme.colors.border};
        border-radius: ${props => props.theme.borderRadius};
        color: ${props => props.theme.colors.text};
        font-size: 14px;
        
        &:focus {
          outline: none;
          border-color: ${props => props.theme.colors.primary};
        }
      }
    }
    
    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
  }
`;

const ClusterManager = () => {
  const [nodes, setNodes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [clusterStats, setClusterStats] = useState({
    totalNodes: 0,
    healthyNodes: 0,
    totalKeys: 0,
    totalMemory: '0MB'
  });

  // Mock cluster nodes data
  const mockNodes = [
    {
      id: 1,
      name: 'Node-01',
      host: 'localhost',
      port: 6379,
      role: 'master',
      status: 'healthy',
      uptime: '2d 14h',
      memory: '256MB',
      cpu: '15%',
      connections: 42,
      keys: 15420,
      lastSeen: new Date()
    },
    {
      id: 2,
      name: 'Node-02',
      host: 'localhost',
      port: 6380,
      role: 'replica',
      status: 'healthy',
      uptime: '2d 14h',
      memory: '198MB',
      cpu: '8%',
      connections: 28,
      keys: 15420,
      lastSeen: new Date()
    },
    {
      id: 3,
      name: 'Node-03',
      host: 'localhost',
      port: 6381,
      role: 'replica',
      status: 'warning',
      uptime: '1d 6h',
      memory: '312MB',
      cpu: '45%',
      connections: 63,
      keys: 15420,
      lastSeen: new Date()
    }
  ];

  const fetchClusterInfo = async () => {
    try {
      // Try to get cluster info from the database
      if (window.electronAPI) {
        const response = await window.electronAPI.executeCommand('CLUSTER', ['INFO']);
        if (response.success) {
          // Parse cluster info and update nodes
          console.log('Cluster info:', response.result);
        }
      }
      
      // For now, use mock data
      setNodes(mockNodes);
      
      // Calculate cluster stats
      const healthyNodes = mockNodes.filter(n => n.status === 'healthy').length;
      const totalKeys = mockNodes.reduce((sum, n) => sum + n.keys, 0);
      const totalMemoryMB = mockNodes.reduce((sum, n) => {
        const memValue = parseInt(n.memory.replace('MB', ''));
        return sum + memValue;
      }, 0);
      
      setClusterStats({
        totalNodes: mockNodes.length,
        healthyNodes,
        totalKeys,
        totalMemory: `${totalMemoryMB}MB`
      });
      
    } catch (error) {
      console.error('Error fetching cluster info:', error);
      // Use mock data as fallback
      setNodes(mockNodes);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchClusterInfo();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAddNode = () => {
    setShowAddModal(true);
  };

  const handleRemoveNode = (nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
  };

  useEffect(() => {
    fetchClusterInfo();
  }, []);

  return (
    <ClusterContainer>
      <ClusterHeader>
        <div className="header-left">
          <h1>Cluster Management</h1>
          <p>Monitor and manage your database cluster nodes</p>
        </div>
        
        <div className="header-actions">
          <ActionButton onClick={handleRefresh} disabled={refreshing}>
            <FiRefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </ActionButton>
          <ActionButton onClick={handleAddNode} className="primary">
            <FiPlus size={16} />
            Add Node
          </ActionButton>
        </div>
      </ClusterHeader>

      <ClusterOverview>
        <OverviewCard color="#3498db">
          <div className="card-header">
            <div className="icon">
              <FiServer size={18} />
            </div>
            <h3>Total Nodes</h3>
          </div>
          <div className="card-value">{clusterStats.totalNodes}</div>
          <div className="card-description">Active cluster nodes</div>
        </OverviewCard>

        <OverviewCard color="#2ecc71">
          <div className="card-header">
            <div className="icon">
              <FiCheck size={18} />
            </div>
            <h3>Healthy Nodes</h3>
          </div>
          <div className="card-value">{clusterStats.healthyNodes}</div>
          <div className="card-description">Nodes operating normally</div>
        </OverviewCard>

        <OverviewCard color="#9b59b6">
          <div className="card-header">
            <div className="icon">
              <FiActivity size={18} />
            </div>
            <h3>Total Keys</h3>
          </div>
          <div className="card-value">{clusterStats.totalKeys.toLocaleString()}</div>
          <div className="card-description">Keys across all nodes</div>
        </OverviewCard>

        <OverviewCard color="#e74c3c">
          <div className="card-header">
            <div className="icon">
              <FiHardDrive size={18} />
            </div>
            <h3>Total Memory</h3>
          </div>
          <div className="card-value">{clusterStats.totalMemory}</div>
          <div className="card-description">Memory usage across cluster</div>
        </OverviewCard>
      </ClusterOverview>

      <NodesGrid>
        {nodes.map(node => (
          <NodeCard key={node.id} status={node.status}>
            <div className="node-header">
              <div className="node-info">
                <div className="status-icon"></div>
                <h4>{node.name}</h4>
                <span className="role">{node.role}</span>
              </div>
              <div className="node-actions">
                <ActionButton>
                  <FiSettings size={14} />
                </ActionButton>
                <ActionButton>
                  <FiInfo size={14} />
                </ActionButton>
                <ActionButton onClick={() => handleRemoveNode(node.id)} className="danger">
                  <FiTrash2 size={14} />
                </ActionButton>
              </div>
            </div>

            <div className="node-details">
              <div className="detail-row">
                <span className="label">Host</span>
                <span className="value">{node.host}:{node.port}</span>
              </div>
              <div className="detail-row">
                <span className="label">Uptime</span>
                <span className="value">{node.uptime}</span>
              </div>
              <div className="detail-row">
                <span className="label">Status</span>
                <span className="value" style={{ 
                  color: node.status === 'healthy' ? '#2ecc71' : 
                         node.status === 'warning' ? '#f39c12' : '#e74c3c'
                }}>
                  {node.status === 'healthy' && <FiWifi size={14} />}
                  {node.status === 'warning' && <FiAlertTriangle size={14} />}
                  {node.status === 'error' && <FiWifiOff size={14} />}
                  {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="node-metrics">
              <div className="metric">
                <div className="metric-value">{node.memory}</div>
                <div className="metric-label">Memory</div>
              </div>
              <div className="metric">
                <div className="metric-value">{node.cpu}</div>
                <div className="metric-label">CPU</div>
              </div>
              <div className="metric">
                <div className="metric-value">{node.connections}</div>
                <div className="metric-label">Connections</div>
              </div>
            </div>
          </NodeCard>
        ))}
      </NodesGrid>

      {showAddModal && (
        <AddNodeModal>
          <div className="modal-content">
            <h3>Add New Node</h3>
            
            <div className="form-group">
              <label>Node Name</label>
              <input type="text" placeholder="Enter node name" />
            </div>
            
            <div className="form-group">
              <label>Host</label>
              <input type="text" placeholder="localhost" />
            </div>
            
            <div className="form-group">
              <label>Port</label>
              <input type="number" placeholder="6379" />
            </div>
            
            <div className="form-group">
              <label>Role</label>
              <select>
                <option value="master">Master</option>
                <option value="replica">Replica</option>
              </select>
            </div>
            
            <div className="modal-actions">
              <ActionButton onClick={() => setShowAddModal(false)}>
                <FiX size={16} />
                Cancel
              </ActionButton>
              <ActionButton className="primary" onClick={() => setShowAddModal(false)}>
                <FiCheck size={16} />
                Add Node
              </ActionButton>
            </div>
          </div>
        </AddNodeModal>
      )}
    </ClusterContainer>
  );
};

export default ClusterManager;
