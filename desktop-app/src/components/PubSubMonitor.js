import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { 
  FiRadio, FiSend, FiTrash2, FiRefreshCw, FiPlay,
  FiPause, FiUsers, FiMessageSquare, FiClock
} from 'react-icons/fi';

const PubSubContainer = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  height: 100vh;
  background-color: ${props => props.theme.colors.background};
  
  @media (max-width: 1200px) {
    grid-template-columns: 250px 1fr 250px;
  }
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }
`;

const SidePanel = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border-right: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  
  &.right {
    border-right: none;
    border-left: 1px solid ${props => props.theme.colors.border};
  }
`;

const PanelHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .panel-actions {
    display: flex;
    gap: 8px;
  }
`;

const ActionButton = styled.button`
  padding: 6px 10px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  transition: ${props => props.theme.transition};
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  
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

const ChannelList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;
`;

const ChannelItem = styled.div`
  padding: 12px;
  border: 1px solid ${props => props.selected ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  margin-bottom: 8px;
  cursor: pointer;
  transition: ${props => props.theme.transition};
  background-color: ${props => props.selected ? 'rgba(52, 152, 219, 0.1)' : 'transparent'};
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background-color: rgba(52, 152, 219, 0.05);
  }
  
  .channel-name {
    font-size: 14px;
    font-weight: 500;
    color: ${props => props.theme.colors.text};
    margin-bottom: 4px;
  }
  
  .channel-info {
    font-size: 12px;
    color: ${props => props.theme.colors.textSecondary};
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const AddChannelForm = styled.div`
  padding: 20px;
  border-top: 1px solid ${props => props.theme.colors.border};
  
  .form-group {
    margin-bottom: 12px;
    
    input {
      width: 100%;
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
    }
  }
`;

const MainPanel = styled.div`
  display: flex;
  flex-direction: column;
`;

const MainHeader = styled.div`
  padding: 20px 30px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.surface};
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    h2 {
      font-size: 20px;
      font-weight: 600;
      color: ${props => props.theme.colors.text};
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .header-actions {
      display: flex;
      gap: 12px;
    }
  }
  
  .channel-info {
    margin-top: 12px;
    font-size: 14px;
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 30px;
  background-color: ${props => props.theme.colors.background};
`;

const Message = styled.div`
  padding: 12px 16px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  margin-bottom: 12px;
  background-color: ${props => props.theme.colors.surface};
  
  .message-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    
    .message-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: ${props => props.theme.colors.textSecondary};
    }
  }
  
  .message-content {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 13px;
    color: ${props => props.theme.colors.text};
    white-space: pre-wrap;
    word-break: break-word;
  }
`;

const PublishForm = styled.div`
  padding: 20px 30px;
  border-top: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.surface};
  
  .form-row {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
    
    input {
      flex: 1;
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
    
    button {
      padding: 10px 16px;
    }
  }
  
  textarea {
    width: 100%;
    padding: 12px;
    background-color: ${props => props.theme.colors.background};
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius};
    color: ${props => props.theme.colors.text};
    font-size: 14px;
    resize: vertical;
    min-height: 80px;
    
    &:focus {
      outline: none;
      border-color: ${props => props.theme.colors.primary};
    }
  }
`;

const SubscribersList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;
`;

const SubscriberItem = styled.div`
  padding: 10px 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  margin-bottom: 8px;
  background-color: ${props => props.theme.colors.background};
  
  .subscriber-name {
    font-size: 14px;
    font-weight: 500;
    color: ${props => props.theme.colors.text};
    margin-bottom: 4px;
  }
  
  .subscriber-info {
    font-size: 12px;
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${props => props.theme.colors.textSecondary};
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  h3 {
    font-size: 18px;
    margin-bottom: 8px;
  }
  
  p {
    font-size: 14px;
  }
`;

const PubSubMonitor = () => {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [newChannelName, setNewChannelName] = useState('');
  const [publishChannel, setPublishChannel] = useState('');
  const [publishMessage, setPublishMessage] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize with mock data
    const mockChannels = [
      { name: 'notifications', subscribers: 12, messages: 45 },
      { name: 'user_events', subscribers: 8, messages: 23 },
      { name: 'system_alerts', subscribers: 3, messages: 7 },
      { name: 'chat_room_1', subscribers: 15, messages: 128 }
    ];

    const mockMessages = [
      {
        id: 1,
        channel: 'notifications',
        content: 'New user registered: john@example.com',
        timestamp: new Date(),
        size: 45
      },
      {
        id: 2,
        channel: 'notifications',
        content: JSON.stringify({ type: 'order', data: { id: 12345, amount: 99.99 } }, null, 2),
        timestamp: new Date(Date.now() - 30000),
        size: 78
      }
    ];

    const mockSubscribers = [
      { id: 1, name: 'WebApp-Frontend', connected: new Date(), address: '192.168.1.100' },
      { id: 2, name: 'Mobile-API', connected: new Date(Date.now() - 300000), address: '192.168.1.101' },
      { id: 3, name: 'Analytics-Service', connected: new Date(Date.now() - 600000), address: '192.168.1.102' }
    ];

    setChannels(mockChannels);
    if (mockChannels.length > 0) {
      setSelectedChannel(mockChannels[0]);
      setMessages(mockMessages);
      setSubscribers(mockSubscribers);
    }
  }, []);

  const handleAddChannel = async () => {
    if (!newChannelName.trim()) return;
    
    try {
      // Add channel subscription
      if (window.electronAPI) {
        const response = await window.electronAPI.executeCommand('SUBSCRIBE', [newChannelName]);
        if (response.success) {
          const newChannel = { name: newChannelName, subscribers: 0, messages: 0 };
          setChannels(prev => [...prev, newChannel]);
          setNewChannelName('');
        }
      }
    } catch (error) {
      console.error('Error adding channel:', error);
    }
  };

  const handleSelectChannel = async (channel) => {
    setSelectedChannel(channel);
    
    try {
      // Get channel info and messages
      if (window.electronAPI) {
        const response = await window.electronAPI.executeCommand('PUBSUB', ['CHANNELS', channel.name]);
        if (response.success) {
          console.log('Channel info:', response.result);
        }
      }
      
      // For now, filter existing messages for this channel
      setMessages(messages.filter(m => m.channel === channel.name));
    } catch (error) {
      console.error('Error fetching channel data:', error);
    }
  };

  const handlePublish = async () => {
    if (!publishChannel.trim() || !publishMessage.trim()) return;
    
    try {
      if (window.electronAPI) {
        const response = await window.electronAPI.executeCommand('PUBLISH', [publishChannel, publishMessage]);
        if (response.success) {
          // Add message to local state if publishing to selected channel
          if (selectedChannel && selectedChannel.name === publishChannel) {
            const newMessage = {
              id: Date.now(),
              channel: publishChannel,
              content: publishMessage,
              timestamp: new Date(),
              size: publishMessage.length
            };
            setMessages(prev => [...prev, newMessage]);
          }
          setPublishMessage('');
        }
      }
    } catch (error) {
      console.error('Error publishing message:', error);
    }
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    // Implementation for real-time monitoring would go here
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString();
  };

  return (
    <PubSubContainer>
      {/* Channels Panel */}
      <SidePanel>
        <PanelHeader>
          <h3>
            <FiRadio size={16} />
            Channels ({channels.length})
          </h3>
          <div className="panel-actions">
            <ActionButton onClick={() => window.location.reload()}>
              <FiRefreshCw size={12} />
            </ActionButton>
          </div>
        </PanelHeader>
        
        <ChannelList>
          {channels.map(channel => (
            <ChannelItem
              key={channel.name}
              selected={selectedChannel?.name === channel.name}
              onClick={() => handleSelectChannel(channel)}
            >
              <div className="channel-name">{channel.name}</div>
              <div className="channel-info">
                <FiUsers size={12} />
                <span>{channel.subscribers} subscribers</span>
                <FiMessageSquare size={12} />
                <span>{channel.messages} messages</span>
              </div>
            </ChannelItem>
          ))}
        </ChannelList>
        
        <AddChannelForm>
          <div className="form-group">
            <input
              type="text"
              placeholder="Channel name..."
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddChannel()}
            />
          </div>
          <ActionButton onClick={handleAddChannel} className="primary">
            Subscribe
          </ActionButton>
        </AddChannelForm>
      </SidePanel>

      {/* Main Messages Panel */}
      <MainPanel>
        {selectedChannel ? (
          <>
            <MainHeader>
              <div className="header-content">
                <h2>
                  <FiMessageSquare size={20} />
                  {selectedChannel.name}
                </h2>
                <div className="header-actions">
                  <ActionButton onClick={toggleMonitoring} className={isMonitoring ? 'primary' : ''}>
                    {isMonitoring ? <FiPause size={14} /> : <FiPlay size={14} />}
                    {isMonitoring ? 'Stop' : 'Monitor'}
                  </ActionButton>
                  <ActionButton>
                    <FiTrash2 size={14} />
                    Clear
                  </ActionButton>
                </div>
              </div>
              <div className="channel-info">
                {selectedChannel.subscribers} subscribers • {messages.length} messages
              </div>
            </MainHeader>

            <MessagesContainer>
              {messages.map(message => (
                <Message key={message.id}>
                  <div className="message-header">
                    <div className="message-info">
                      <FiClock size={12} />
                      <span>{formatTime(message.timestamp)}</span>
                      <span>•</span>
                      <span>{message.size} bytes</span>
                    </div>
                  </div>
                  <div className="message-content">{message.content}</div>
                </Message>
              ))}
              <div ref={messagesEndRef} />
            </MessagesContainer>

            <PublishForm>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Channel name..."
                  value={publishChannel}
                  onChange={(e) => setPublishChannel(e.target.value)}
                />
                <ActionButton onClick={handlePublish} className="primary">
                  <FiSend size={14} />
                  Publish
                </ActionButton>
              </div>
              <textarea
                placeholder="Message content..."
                value={publishMessage}
                onChange={(e) => setPublishMessage(e.target.value)}
              />
            </PublishForm>
          </>
        ) : (
          <EmptyState>
            <FiMessageSquare className="empty-icon" />
            <h3>No Channel Selected</h3>
            <p>Select a channel to view messages or subscribe to a new one</p>
          </EmptyState>
        )}
      </MainPanel>

      {/* Subscribers Panel */}
      <SidePanel className="right">
        <PanelHeader>
          <h3>
            <FiUsers size={16} />
            Subscribers ({subscribers.length})
          </h3>
        </PanelHeader>
        
        <SubscribersList>
          {subscribers.map(subscriber => (
            <SubscriberItem key={subscriber.id}>
              <div className="subscriber-name">{subscriber.name}</div>
              <div className="subscriber-info">
                Connected {formatTime(subscriber.connected)}
                <br />
                {subscriber.address}
              </div>
            </SubscriberItem>
          ))}
        </SubscribersList>
      </SidePanel>
    </PubSubContainer>
  );
};

export default PubSubMonitor;
