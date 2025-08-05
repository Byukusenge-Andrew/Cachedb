import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiSearch, FiPlus, FiTrash2, FiRefreshCw,
  FiType, FiList, FiHash, FiLayers, FiClock, FiEye,
  FiEdit, FiCopy, FiDownload, FiUpload, FiMoreHorizontal
} from 'react-icons/fi';

const BrowserContainer = styled.div`
  display: grid;
  grid-template-columns: 350px 1fr;
  height: 100vh;
  background-color: ${props => props.theme.colors.background};
`;

const KeysList = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border-right: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
`;

const KeysHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  h2 {
    font-size: 18px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 15px;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 15px;
  
  input {
    width: 100%;
    padding: 10px 16px 10px 40px;
    background-color: ${props => props.theme.colors.background};
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius};
    color: ${props => props.theme.colors.text};
    font-size: 14px;
    
    &:focus {
      outline: none;
      border-color: ${props => props.theme.colors.primary};
    }
    
    &::placeholder {
      color: ${props => props.theme.colors.textSecondary};
    }
  }
  
  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
`;

const FilterButton = styled.button`
  padding: 6px 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  background-color: ${props => props.active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.active ? 'white' : props.theme.colors.textSecondary};
  font-size: 12px;
  cursor: pointer;
  transition: ${props => props.theme.transition};
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background-color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.border};
    color: ${props => props.active ? 'white' : props.theme.colors.text};
  }
`;

const KeysActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 8px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  background-color: transparent;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  transition: ${props => props.theme.transition};
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: ${props => props.theme.colors.border};
    color: ${props => props.theme.colors.text};
  }
  
  &.primary {
    background-color: ${props => props.theme.colors.primary};
    color: white;
    border-color: ${props => props.theme.colors.primary};
    
    &:hover {
      background-color: ${props => props.theme.colors.primary}dd;
    }
  }
`;

const KeysListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;
`;

const KeyItem = styled.div`
  padding: 12px;
  border: 1px solid ${props => props.selected ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  margin-bottom: 8px;
  cursor: pointer;
  transition: ${props => props.theme.transition};
  background-color: ${props => props.selected ? props.theme.colors.primary + '10' : 'transparent'};
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background-color: ${props => props.theme.colors.primary + '05'};
  }
  
  .key-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  
  .key-name {
    font-size: 14px;
    font-weight: 500;
    color: ${props => props.theme.colors.text};
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .key-type {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    background-color: ${props => props.typeColor || props.theme.colors.primary};
    color: white;
    text-transform: uppercase;
    font-weight: 600;
  }
  
  .key-meta {
    font-size: 12px;
    color: ${props => props.theme.colors.textSecondary};
    display: flex;
    align-items: center;
    gap: 12px;
  }
`;

const KeyViewer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const ViewerHeader = styled.div`
  padding: 20px 30px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.surface};
  
  .key-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
    
    h3 {
      font-size: 20px;
      font-weight: 600;
      color: ${props => props.theme.colors.text};
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .key-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .key-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    
    .info-item {
      .label {
        font-size: 12px;
        color: ${props => props.theme.colors.textSecondary};
        text-transform: uppercase;
        font-weight: 600;
        margin-bottom: 4px;
      }
      
      .value {
        font-size: 14px;
        color: ${props => props.theme.colors.text};
        font-weight: 500;
      }
    }
  }
`;

const ViewerContent = styled.div`
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  background-color: ${props => props.theme.colors.background};
`;

const ValueEditor = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  overflow: hidden;
  
  .editor-header {
    padding: 15px 20px;
    border-bottom: 1px solid ${props => props.theme.colors.border};
    background-color: ${props => props.theme.colors.background};
    font-size: 14px;
    font-weight: 500;
    color: ${props => props.theme.colors.text};
  }
  
  .editor-content {
    padding: 20px;
    
    textarea {
      width: 100%;
      min-height: 200px;
      padding: 15px;
      background-color: ${props => props.theme.colors.background};
      border: 1px solid ${props => props.theme.colors.border};
      border-radius: ${props => props.theme.borderRadius};
      color: ${props => props.theme.colors.text};
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 13px;
      resize: vertical;
      
      &:focus {
        outline: none;
        border-color: ${props => props.theme.colors.primary};
      }
    }
  }
`;

const ListViewer = styled.div`
  .list-item {
    padding: 12px 16px;
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius};
    margin-bottom: 8px;
    background-color: ${props => props.theme.colors.surface};
    
    .item-header {
      display: flex;
      align-items: center;
      justify-content: between;
      margin-bottom: 8px;
      
      .index {
        font-size: 12px;
        color: ${props => props.theme.colors.textSecondary};
        font-weight: 600;
      }
      
      .actions {
        display: flex;
        gap: 4px;
      }
    }
    
    .item-value {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 13px;
      color: ${props => props.theme.colors.text};
      word-break: break-all;
    }
  }
`;

const HashViewer = styled.div`
  .hash-field {
    padding: 16px;
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius};
    margin-bottom: 12px;
    background-color: ${props => props.theme.colors.surface};
    
    .field-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      
      .field-name {
        font-size: 14px;
        font-weight: 600;
        color: ${props => props.theme.colors.text};
      }
    }
    
    .field-value {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 13px;
      color: ${props => props.theme.colors.text};
      word-break: break-all;
    }
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

const KeyBrowser = () => {
  const [keys, setKeys] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedKeyData, setSelectedKeyData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(false);

  const typeColors = {
    string: '#3498db',
    list: '#2ecc71',
    set: '#e74c3c',
    hash: '#f39c12',
    zset: '#9b59b6'
  };

  const typeIcons = {
    string: FiType,
    list: FiList,
    set: FiLayers,
    hash: FiHash,
    zset: FiLayers
  };

  const filteredKeys = useMemo(() => {
    return keys.filter(key => {
      const matchesSearch = key.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || key.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [keys, searchQuery, typeFilter]);

  const fetchKeys = async () => {
    try {
      if (window.electronAPI) {
        const response = await window.electronAPI.getKeys('*');
        if (response.success) {
          const keyList = [];
          
          // For each key, get its type and other info
          for (const keyName of response.keys) {
            try {
              const keyInfo = await window.electronAPI.getKeyValue(keyName);
              if (keyInfo.success) {
                keyList.push({
                  name: keyName,
                  type: keyInfo.type || 'string',
                  size: JSON.stringify(keyInfo.value).length,
                  ttl: keyInfo.ttl > 0 ? keyInfo.ttl : null
                });
              }
            } catch (error) {
              // If we can't get key info, add it with basic info
              keyList.push({
                name: keyName,
                type: 'string',
                size: 0,
                ttl: null
              });
            }
          }
          
          setKeys(keyList);
        }
      }
    } catch (error) {
      console.error('Error fetching keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchKeys();
    setRefreshing(false);
  };

  const handleDeleteKey = async (keyName) => {
    try {
      if (window.electronAPI) {
        const response = await window.electronAPI.deleteKey(keyName);
        if (response.success) {
          setKeys(prev => prev.filter(k => k.name !== keyName));
          if (selectedKey?.name === keyName) {
            setSelectedKey(null);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting key:', error);
    }
  };

  const handleKeySelect = async (key) => {
    setSelectedKey(key);
    if (window.electronAPI) {
      try {
        const response = await window.electronAPI.getKeyValue(key.name);
        if (response.success) {
          setSelectedKeyData(response);
        }
      } catch (error) {
        console.error('Error fetching key value:', error);
      }
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await window.electronAPI.getConnectionStatus();
      setConnectionStatus(response.connected);
    } catch (error) {
      setConnectionStatus(false);
    }
  };

  // Load keys on component mount and check connection
  useEffect(() => {
    checkConnectionStatus();
    fetchKeys();
  }, []);

  const renderKeyValue = (key) => {
    if (!key || !selectedKeyData) return null;

    const { value, type } = selectedKeyData;

    switch (type) {
      case 'string':
        return (
          <ValueEditor>
            <div className="editor-header">String Value</div>
            <div className="editor-content">
              <textarea 
                defaultValue={value || ''}
                placeholder="Enter string value..."
                readOnly
              />
            </div>
          </ValueEditor>
        );

      case 'list':
        const listItems = Array.isArray(value) ? value : [];
        return (
          <ListViewer>
            {listItems.map((item, index) => (
              <div key={index} className="list-item">
                <div className="item-header">
                  <span className="index">[{index}]</span>
                  <div className="actions">
                    <ActionButton><FiEdit size={12} /></ActionButton>
                    <ActionButton><FiTrash2 size={12} /></ActionButton>
                  </div>
                </div>
                <div className="item-value">{String(item)}</div>
              </div>
            ))}
          </ListViewer>
        );

      case 'hash':
        const hashFields = typeof value === 'object' && value !== null ? value : {};
        return (
          <HashViewer>
            {Object.entries(hashFields).map(([field, fieldValue]) => (
              <div key={field} className="hash-field">
                <div className="field-header">
                  <span className="field-name">{field}</span>
                  <div className="actions">
                    <ActionButton><FiEdit size={12} /></ActionButton>
                    <ActionButton><FiTrash2 size={12} /></ActionButton>
                  </div>
                </div>
                <div className="field-value">{String(fieldValue)}</div>
              </div>
            ))}
          </HashViewer>
        );

      case 'set':
        const setMembers = Array.isArray(value) ? value : [];
        return (
          <ListViewer>
            {setMembers.map((member, index) => (
              <div key={index} className="list-item">
                <div className="item-header">
                  <span className="index">Member</span>
                  <div className="actions">
                    <ActionButton><FiTrash2 size={12} /></ActionButton>
                  </div>
                </div>
                <div className="item-value">{String(member)}</div>
              </div>
            ))}
          </ListViewer>
        );

      default:
        return (
          <ValueEditor>
            <div className="editor-header">{type.toUpperCase()} Value</div>
            <div className="editor-content">
              <textarea 
                defaultValue={JSON.stringify(value, null, 2)}
                placeholder="Value..."
                readOnly
              />
            </div>
          </ValueEditor>
        );
    }
  };

  return (
    <BrowserContainer>
      <KeysList>
        <KeysHeader>
          <h2>Keys ({filteredKeys.length})</h2>
          
          <SearchContainer>
            <FiSearch className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search keys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchContainer>

          <FilterBar>
            <FilterButton 
              active={typeFilter === 'all'} 
              onClick={() => setTypeFilter('all')}
            >
              All
            </FilterButton>
            {Object.keys(typeColors).map(type => (
              <FilterButton
                key={type}
                active={typeFilter === type}
                onClick={() => setTypeFilter(type)}
              >
                {type}
              </FilterButton>
            ))}
          </FilterBar>

          <KeysActions>
            <ActionButton onClick={handleRefresh} disabled={refreshing}>
              <FiRefreshCw size={14} className={refreshing ? 'spinning' : ''} />
            </ActionButton>
            <ActionButton className="primary">
              <FiPlus size={14} />
            </ActionButton>
          </KeysActions>
        </KeysHeader>

        <KeysListContainer>
          {filteredKeys.map(key => {
            const IconComponent = typeIcons[key.type] || FiType;
            return (
              <KeyItem
                key={key.name}
                selected={selectedKey?.name === key.name}
                onClick={() => handleKeySelect(key)}
                typeColor={typeColors[key.type]}
              >
                <div className="key-header">
                  <div className="key-name">
                    <IconComponent size={14} />
                    {key.name}
                  </div>
                  <span className="key-type" style={{ backgroundColor: typeColors[key.type] }}>
                    {key.type}
                  </span>
                </div>
                <div className="key-meta">
                  <span>{key.size} bytes</span>
                  {key.ttl && (
                    <>
                      <FiClock size={12} />
                      <span>{key.ttl}s</span>
                    </>
                  )}
                </div>
              </KeyItem>
            );
          })}
        </KeysListContainer>
      </KeysList>

      <KeyViewer>
        {selectedKey ? (
          <>
            <ViewerHeader>
              <div className="key-title">
                <h3>
                  {React.createElement(typeIcons[selectedKey.type] || FiType, { size: 20 })}
                  {selectedKey.name}
                </h3>
                <div className="key-actions">
                  <ActionButton><FiCopy size={14} /></ActionButton>
                  <ActionButton><FiDownload size={14} /></ActionButton>
                  <ActionButton><FiUpload size={14} /></ActionButton>
                  <ActionButton><FiMoreHorizontal size={14} /></ActionButton>
                  <ActionButton onClick={() => handleDeleteKey(selectedKey.name)}>
                    <FiTrash2 size={14} />
                  </ActionButton>
                </div>
              </div>
              
              <div className="key-info">
                <div className="info-item">
                  <div className="label">Type</div>
                  <div className="value">{selectedKey.type.toUpperCase()}</div>
                </div>
                <div className="info-item">
                  <div className="label">Size</div>
                  <div className="value">{selectedKey.size} bytes</div>
                </div>
                <div className="info-item">
                  <div className="label">TTL</div>
                  <div className="value">{selectedKey.ttl ? `${selectedKey.ttl}s` : 'No expiration'}</div>
                </div>
                <div className="info-item">
                  <div className="label">Memory</div>
                  <div className="value">{Math.round(selectedKey.size * 1.2)} bytes</div>
                </div>
              </div>
            </ViewerHeader>

            <ViewerContent>
              {renderKeyValue(selectedKey)}
            </ViewerContent>
          </>
        ) : (
          <EmptyState>
            <FiEye className="empty-icon" />
            <h3>No Key Selected</h3>
            <p>Select a key from the list to view its contents</p>
          </EmptyState>
        )}
      </KeyViewer>
    </BrowserContainer>
  );
};

export default KeyBrowser;
