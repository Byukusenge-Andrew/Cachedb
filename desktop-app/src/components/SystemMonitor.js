import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  FiCpu, FiHardDrive, FiDatabase, FiWifi, FiZap, FiTarget, FiAlertTriangle
} from 'react-icons/fi';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const MonitorContainer = styled.div`
  padding: 30px;
  overflow-y: auto;
  height: 100vh;
  background-color: ${props => props.theme.colors.background};
`;

const MonitorHeader = styled.div`
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

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const MetricCard = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  padding: 24px;
  
  .metric-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    
    .metric-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: ${props => props.color || props.theme.colors.primary};
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .metric-info {
      h3 {
        font-size: 16px;
        font-weight: 600;
        color: ${props => props.theme.colors.text};
        margin: 0 0 4px 0;
      }
      
      .metric-subtitle {
        font-size: 12px;
        color: ${props => props.theme.colors.textSecondary};
        text-transform: uppercase;
        font-weight: 500;
      }
    }
  }
  
  .metric-value {
    font-size: 32px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 8px;
  }
  
  .metric-unit {
    font-size: 14px;
    color: ${props => props.theme.colors.textSecondary};
    margin-left: 4px;
  }
  
  .metric-change {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    
    &.positive {
      color: #27ae60;
    }
    
    &.negative {
      color: #e74c3c;
    }
    
    &.neutral {
      color: ${props => props.theme.colors.textSecondary};
    }
  }
  
  .metric-bar {
    margin-top: 12px;
    
    .bar-track {
      height: 4px;
      background-color: ${props => props.theme.colors.border};
      border-radius: 2px;
      overflow: hidden;
      
      .bar-fill {
        height: 100%;
        background: ${props => props.color || props.theme.colors.primary};
        border-radius: 2px;
        transition: width 0.3s ease;
      }
    }
    
    .bar-label {
      display: flex;
      justify-content: space-between;
      margin-top: 4px;
      font-size: 11px;
      color: ${props => props.theme.colors.textSecondary};
    }
  }
`;

const ChartSection = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  padding: 24px;
  margin-bottom: 20px;
  
  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    
    h3 {
      font-size: 18px;
      font-weight: 600;
      color: ${props => props.theme.colors.text};
      margin: 0;
    }
    
    .chart-controls {
      display: flex;
      gap: 8px;
    }
  }
  
  .chart-container {
    height: 300px;
  }
`;

const ControlButton = styled.button`
  padding: 6px 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  background-color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.background};
  color: ${props => props.active ? 'white' : props.theme.colors.text};
  font-size: 12px;
  cursor: pointer;
  transition: ${props => props.theme.transition};
  
  &:hover {
    background-color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.border};
  }
`;

const SuggestionCard = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  padding: 20px;
  border-left: 4px solid ${props => 
    props.priority === 'high' ? '#e74c3c' : 
    props.priority === 'medium' ? '#f39c12' : '#27ae60'};
  
  .suggestion-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    
    .suggestion-icon {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: ${props => 
        props.priority === 'high' ? '#e74c3c' : 
        props.priority === 'medium' ? '#f39c12' : '#27ae60'};
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .suggestion-info {
      h4 {
        font-size: 16px;
        font-weight: 600;
        color: ${props => props.theme.colors.text};
        margin: 0 0 4px 0;
      }
      
      .suggestion-type {
        font-size: 12px;
        color: ${props => props.theme.colors.textSecondary};
        text-transform: uppercase;
        font-weight: 500;
      }
    }
  }
  
  .suggestion-description {
    font-size: 14px;
    color: ${props => props.theme.colors.textSecondary};
    margin-bottom: 16px;
    line-height: 1.5;
  }
  
  .suggestion-recommendations {
    h5 {
      font-size: 14px;
      font-weight: 600;
      color: ${props => props.theme.colors.text};
      margin: 0 0 8px 0;
    }
    
    ul {
      margin: 0;
      padding-left: 20px;
      
      li {
        font-size: 13px;
        color: ${props => props.theme.colors.textSecondary};
        margin-bottom: 4px;
        line-height: 1.4;
      }
    }
  }
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const StatusCard = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  padding: 20px;
  
  .status-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    
    h3 {
      font-size: 16px;
      font-weight: 600;
      color: ${props => props.theme.colors.text};
      margin: 0;
    }
    
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: ${props => props.status === 'healthy' ? '#27ae60' : 
                                 props.status === 'warning' ? '#f39c12' : '#e74c3c'};
    }
  }
  
  .status-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    
    .item-label {
      color: ${props => props.theme.colors.textSecondary};
    }
    
    .item-value {
      color: ${props => props.theme.colors.text};
      font-weight: 500;
    }
  }
`;

const SystemMonitor = () => {
  const [timeRange, setTimeRange] = useState('1h');
  const [systemMetrics, setSystemMetrics] = useState({
    cpu: { usage: 45.6, cores: 8, temperature: 58 },
    memory: { used: 8.2, total: 16, percentage: 51.2 },
    disk: { used: 245, total: 512, percentage: 47.8 },
    network: { inbound: 12.4, outbound: 8.7 }
  });

  const [performanceData, setPerformanceData] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  // Generate AI cache optimization suggestions
  const generateCacheOptimizations = useCallback((metrics) => {
    const suggestions = [];
    
    // CPU-based suggestions
    if (metrics.cpu.usage > 80) {
      suggestions.push({
        type: 'performance',
        priority: 'high',
        title: 'High CPU Usage Detected',
        description: 'Consider implementing CPU cache optimizations to reduce processing overhead.',
        recommendations: [
          'Enable CPU instruction cache prefetching',
          'Optimize memory access patterns for better L1/L2 cache utilization',
          'Consider thread affinity settings to maintain cache locality'
        ]
      });
    }

    // Memory-based suggestions
    if (metrics.memory.percentage > 70) {
      suggestions.push({
        type: 'memory',
        priority: 'medium',
        title: 'Memory Pressure Optimization',
        description: 'High memory usage can benefit from intelligent caching strategies.',
        recommendations: [
          'Implement LRU (Least Recently Used) cache eviction policy',
          'Consider memory compression for cached data',
          'Optimize object pooling to reduce garbage collection pressure'
        ]
      });
    }

    // Database cache suggestions
    suggestions.push({
      type: 'database',
      priority: 'medium',
      title: 'Database Cache Enhancement',
      description: 'Periodic analysis suggests database cache optimizations.',
      recommendations: [
        'Increase query cache size for frequently accessed data',
        'Implement intelligent cache warming strategies',
        'Consider distributed caching for high-availability scenarios'
      ]
    });

    return suggestions;
  }, []);

  // Simulate real-time data updates
  useEffect(() => {
    const updateMetrics = () => {
      const newMetrics = {
        cpu: { 
          ...systemMetrics.cpu,
          usage: Math.max(0, Math.min(100, systemMetrics.cpu.usage + (Math.random() - 0.5) * 10)),
          temperature: Math.max(30, Math.min(85, systemMetrics.cpu.temperature + (Math.random() - 0.5) * 5))
        },
        memory: { 
          ...systemMetrics.memory,
          percentage: Math.max(0, Math.min(100, systemMetrics.memory.percentage + (Math.random() - 0.5) * 5))
        },
        disk: systemMetrics.disk,
        network: {
          inbound: Math.max(0, systemMetrics.network.inbound + (Math.random() - 0.5) * 5),
          outbound: Math.max(0, systemMetrics.network.outbound + (Math.random() - 0.5) * 3)
        }
      };
      
      setSystemMetrics(newMetrics);

      // Generate AI suggestions based on current metrics
      setAiSuggestions(generateCacheOptimizations(newMetrics));

      // Add new performance data point
      setPerformanceData(prev => {
        const now = new Date();
        const newPoint = {
          time: now.toLocaleTimeString(),
          timestamp: now.getTime(),
          cpu: newMetrics.cpu.usage,
          memory: newMetrics.memory.percentage,
          network: newMetrics.network.inbound + newMetrics.network.outbound
        };
        
        const updated = [...prev, newPoint];
        return updated.slice(-20); // Keep last 20 points
      });
    };

    const interval = setInterval(updateMetrics, 3000);
    return () => clearInterval(interval);
  }, [systemMetrics, generateCacheOptimizations]);

  return (
    <MonitorContainer>
      <MonitorHeader>
        <h1>System Monitor</h1>
        <p>Real-time system performance and health monitoring</p>
      </MonitorHeader>

      <MetricsGrid>
        <MetricCard color="#3498db">
          <div className="metric-header">
            <div className="metric-icon">
              <FiCpu size={20} />
            </div>
            <div className="metric-info">
              <h3>CPU Usage</h3>
              <div className="metric-subtitle">{systemMetrics.cpu.cores} Cores</div>
            </div>
          </div>
          <div className="metric-value">
            {systemMetrics.cpu.usage.toFixed(1)}
            <span className="metric-unit">%</span>
          </div>
          <div className="metric-change neutral">
            Temperature: {systemMetrics.cpu.temperature}°C
          </div>
          <div className="metric-bar">
            <div className="bar-track">
              <div 
                className="bar-fill" 
                style={{ width: `${systemMetrics.cpu.usage}%` }}
              />
            </div>
            <div className="bar-label">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </MetricCard>

        <MetricCard color="#e74c3c">
          <div className="metric-header">
            <div className="metric-icon">
              <FiHardDrive size={20} />
            </div>
            <div className="metric-info">
              <h3>Memory Usage</h3>
              <div className="metric-subtitle">{systemMetrics.memory.total} GB Total</div>
            </div>
          </div>
          <div className="metric-value">
            {systemMetrics.memory.used}
            <span className="metric-unit">GB</span>
          </div>
          <div className="metric-change neutral">
            {systemMetrics.memory.percentage.toFixed(1)}% used
          </div>
          <div className="metric-bar">
            <div className="bar-track">
              <div 
                className="bar-fill" 
                style={{ width: `${systemMetrics.memory.percentage}%` }}
              />
            </div>
            <div className="bar-label">
              <span>0 GB</span>
              <span>{systemMetrics.memory.total} GB</span>
            </div>
          </div>
        </MetricCard>

        <MetricCard color="#2ecc71">
          <div className="metric-header">
            <div className="metric-icon">
              <FiDatabase size={20} />
            </div>
            <div className="metric-info">
              <h3>Disk Usage</h3>
              <div className="metric-subtitle">{systemMetrics.disk.total} GB Total</div>
            </div>
          </div>
          <div className="metric-value">
            {systemMetrics.disk.used}
            <span className="metric-unit">GB</span>
          </div>
          <div className="metric-change neutral">
            {systemMetrics.disk.percentage.toFixed(1)}% used
          </div>
          <div className="metric-bar">
            <div className="bar-track">
              <div 
                className="bar-fill" 
                style={{ width: `${systemMetrics.disk.percentage}%` }}
              />
            </div>
            <div className="bar-label">
              <span>0 GB</span>
              <span>{systemMetrics.disk.total} GB</span>
            </div>
          </div>
        </MetricCard>

        <MetricCard color="#9b59b6">
          <div className="metric-header">
            <div className="metric-icon">
              <FiWifi size={20} />
            </div>
            <div className="metric-info">
              <h3>Network I/O</h3>
              <div className="metric-subtitle">Real-time</div>
            </div>
          </div>
          <div className="metric-value">
            {(systemMetrics.network.inbound + systemMetrics.network.outbound).toFixed(1)}
            <span className="metric-unit">MB/s</span>
          </div>
          <div className="metric-change neutral">
            ↓ {systemMetrics.network.inbound.toFixed(1)} MB/s ↑ {systemMetrics.network.outbound.toFixed(1)} MB/s
          </div>
        </MetricCard>
      </MetricsGrid>

      <ChartSection>
        <div className="chart-header">
          <h3>Performance Trends</h3>
          <div className="chart-controls">
            {['1h', '6h', '24h', '7d'].map(range => (
              <ControlButton
                key={range}
                active={timeRange === range}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </ControlButton>
            ))}
          </div>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9CA3AF"
                fontSize={12}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Area
                type="monotone"
                dataKey="cpu"
                stackId="1"
                stroke="#3498db"
                fill="#3498db"
                fillOpacity={0.6}
                name="CPU %"
              />
              <Area
                type="monotone"
                dataKey="memory"
                stackId="1"
                stroke="#e74c3c"
                fill="#e74c3c"
                fillOpacity={0.6}
                name="Memory %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartSection>

      <StatusGrid>
        <StatusCard status="healthy">
          <div className="status-header">
            <h3>Database Status</h3>
            <div className="status-indicator" />
          </div>
          <div className="status-items">
            <div className="status-item">
              <span className="item-label">Connection Pool</span>
              <span className="item-value">8/10 Active</span>
            </div>
            <div className="status-item">
              <span className="item-label">Query Response</span>
              <span className="item-value">1.2ms avg</span>
            </div>
            <div className="status-item">
              <span className="item-label">Cache Hit Rate</span>
              <span className="item-value">94.5%</span>
            </div>
            <div className="status-item">
              <span className="item-label">Last Backup</span>
              <span className="item-value">2 hours ago</span>
            </div>
          </div>
        </StatusCard>

        <StatusCard status="healthy">
          <div className="status-header">
            <h3>Web Server</h3>
            <div className="status-indicator" />
          </div>
          <div className="status-items">
            <div className="status-item">
              <span className="item-label">Active Connections</span>
              <span className="item-value">24</span>
            </div>
            <div className="status-item">
              <span className="item-label">Requests/sec</span>
              <span className="item-value">45.3</span>
            </div>
            <div className="status-item">
              <span className="item-label">Error Rate</span>
              <span className="item-value">0.02%</span>
            </div>
            <div className="status-item">
              <span className="item-label">Uptime</span>
              <span className="item-value">15d 8h 23m</span>
            </div>
          </div>
        </StatusCard>

        <StatusCard status="warning">
          <div className="status-header">
            <h3>Cluster Health</h3>
            <div className="status-indicator" />
          </div>
          <div className="status-items">
            <div className="status-item">
              <span className="item-label">Active Nodes</span>
              <span className="item-value">2/3</span>
            </div>
            <div className="status-item">
              <span className="item-label">Sync Status</span>
              <span className="item-value">Syncing</span>
            </div>
            <div className="status-item">
              <span className="item-label">Replication Lag</span>
              <span className="item-value">45ms</span>
            </div>
            <div className="status-item">
              <span className="item-label">Last Election</span>
              <span className="item-value">3 hours ago</span>
            </div>
          </div>
        </StatusCard>
      </StatusGrid>

      {aiSuggestions.length > 0 && (
        <>
          <MonitorHeader style={{ marginTop: '40px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>
              AI Cache Optimization Suggestions
            </h2>
            <p style={{ margin: 0 }}>Intelligent recommendations based on current system metrics</p>
          </MonitorHeader>
          
          <StatusGrid>
            {aiSuggestions.map((suggestion, index) => (
              <SuggestionCard key={index} priority={suggestion.priority}>
                <div className="suggestion-header">
                  <div className="suggestion-icon">
                    {suggestion.priority === 'high' ? <FiAlertTriangle size={16} /> :
                     suggestion.priority === 'medium' ? <FiZap size={16} /> :
                     <FiTarget size={16} />}
                  </div>
                  <div className="suggestion-info">
                    <h4>{suggestion.title}</h4>
                    <div className="suggestion-type">{suggestion.type} • {suggestion.priority} priority</div>
                  </div>
                </div>
                <div className="suggestion-description">
                  {suggestion.description}
                </div>
                <div className="suggestion-recommendations">
                  <h5>Recommendations:</h5>
                  <ul>
                    {suggestion.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </SuggestionCard>
            ))}
          </StatusGrid>
        </>
      )}
    </MonitorContainer>
  );
};

export default SystemMonitor;
