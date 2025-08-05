import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiTerminal, FiX, FiCopy, FiDownload, FiSettings } from 'react-icons/fi';

const CliContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${props => props.theme.colors.background};
`;

const CliHeader = styled.div`
  padding: 20px 30px;
  background-color: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    
    h2 {
      font-size: 20px;
      font-weight: 600;
      color: ${props => props.theme.colors.text};
      margin: 0;
    }
    
    .connection-status {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      
      &.connected {
        background-color: ${props => props.theme.colors.success}20;
        color: ${props => props.theme.colors.success};
      }
      
      &.disconnected {
        background-color: ${props => props.theme.colors.danger}20;
        color: ${props => props.theme.colors.danger};
      }
    }
  }
  
  .header-actions {
    display: flex;
    gap: 12px;
  }
`;

const ActionButton = styled.button`
  padding: 8px 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  background-color: transparent;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  transition: ${props => props.theme.transition};
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  
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

const TerminalContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #1a1a1a;
  color: #e0e0e0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.4;
  height: 100%;
  min-height: 0; /* Important: allows flex child to shrink */
`;

const TerminalOutput = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 0; /* Important: allows flex child to shrink */
  max-height: calc(100vh - 200px); /* Ensure container doesn't exceed viewport */
  scroll-behavior: smooth;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #2d2d2d;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #777;
  }
`;

const TerminalLine = styled.div`
  margin-bottom: 4px;
  
  &.command {
    color: #4fc3f7;
    
    .prompt {
      color: #81c784;
      margin-right: 8px;
    }
  }
  
  &.output {
    color: #e0e0e0;
    margin-left: 16px;
  }
  
  &.error {
    color: #f48fb1;
    margin-left: 16px;
  }
  
  &.success {
    color: #81c784;
    margin-left: 16px;
  }
  
  &.info {
    color: #64b5f6;
    margin-left: 16px;
  }
`;

const TerminalInput = styled.div`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background-color: #2d2d2d;
  border-top: 1px solid #404040;
  
  .prompt {
    color: #81c784;
    margin-right: 8px;
    font-weight: 600;
  }
  
  input {
    flex: 1;
    background: transparent;
    border: none;
    color: #4fc3f7;
    font-family: inherit;
    font-size: inherit;
    outline: none;
    
    &::placeholder {
      color: #757575;
    }
  }
`;

const CommandSuggestions = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background-color: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 4px 4px 0 0;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
`;

const SuggestionItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover, &.selected {
    background-color: #404040;
  }
  
  .command-name {
    color: #4fc3f7;
    font-weight: 600;
  }
  
  .command-description {
    color: #bdbdbd;
    font-size: 12px;
    margin-top: 2px;
  }
`;

const QuickCommands = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 15px 20px;
  background-color: #2d2d2d;
  border-top: 1px solid #404040;
`;

const QuickCommand = styled.button`
  padding: 6px 12px;
  background-color: #404040;
  border: 1px solid #555;
  border-radius: 4px;
  color: #e0e0e0;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #555;
    border-color: #777;
  }
`;

const CLI = ({ isConnected = true }) => {
  const [output, setOutput] = useState([
    { type: 'info', text: 'Welcome to MyRedis CLI v1.0.0' },
    { type: 'info', text: 'Type "help" for a list of available commands.' },
    { type: 'info', text: '' }
  ]);
  
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(isConnected);
  
  const outputRef = useRef(null);
  const inputRef = useRef(null);

  // Check connection status periodically
  useEffect(() => {
    const checkConnection = async () => {
      if (window.electronAPI) {
        try {
          const status = await window.electronAPI.getConnectionStatus();
          setConnectionStatus(status.connected);
        } catch (error) {
          setConnectionStatus(false);
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const commands = {
    // String commands
    'SET': { description: 'Set key to hold the string value', syntax: 'SET key value [EX seconds]' },
    'GET': { description: 'Get the value of key', syntax: 'GET key' },
    'DEL': { description: 'Delete a key', syntax: 'DEL key [key ...]' },
    'EXISTS': { description: 'Determine if a key exists', syntax: 'EXISTS key' },
    'EXPIRE': { description: 'Set a timeout on key', syntax: 'EXPIRE key seconds' },
    'TTL': { description: 'Get the time to live for a key', syntax: 'TTL key' },
    'KEYS': { description: 'Find all keys matching pattern', syntax: 'KEYS pattern' },
    'TYPE': { description: 'Determine the type stored at key', syntax: 'TYPE key' },
    
    // List commands
    'LPUSH': { description: 'Insert element at the head of the list', syntax: 'LPUSH key element [element ...]' },
    'RPUSH': { description: 'Insert element at the tail of the list', syntax: 'RPUSH key element [element ...]' },
    'LPOP': { description: 'Remove and get the first element in a list', syntax: 'LPOP key' },
    'RPOP': { description: 'Remove and get the last element in a list', syntax: 'RPOP key' },
    'LLEN': { description: 'Get the length of a list', syntax: 'LLEN key' },
    'LRANGE': { description: 'Get a range of elements from a list', syntax: 'LRANGE key start stop' },
    
    // Set commands
    'SADD': { description: 'Add member to set', syntax: 'SADD key member [member ...]' },
    'SREM': { description: 'Remove member from set', syntax: 'SREM key member [member ...]' },
    'SMEMBERS': { description: 'Get all members in a set', syntax: 'SMEMBERS key' },
    'SCARD': { description: 'Get the number of members in a set', syntax: 'SCARD key' },
    'SISMEMBER': { description: 'Determine if value is a member of the set', syntax: 'SISMEMBER key member' },
    
    // Hash commands
    'HSET': { description: 'Set hash field to value', syntax: 'HSET key field value [field value ...]' },
    'HGET': { description: 'Get hash field value', syntax: 'HGET key field' },
    'HGETALL': { description: 'Get all fields and values in a hash', syntax: 'HGETALL key' },
    'HDEL': { description: 'Delete hash fields', syntax: 'HDEL key field [field ...]' },
    'HLEN': { description: 'Get number of fields in hash', syntax: 'HLEN key' },
    'HKEYS': { description: 'Get all field names in hash', syntax: 'HKEYS key' },
    'HVALS': { description: 'Get all values in hash', syntax: 'HVALS key' },
    
    // Server commands
    'INFO': { description: 'Get information and statistics about the server', syntax: 'INFO [section]' },
    'PING': { description: 'Ping the server', syntax: 'PING [message]' },
    'FLUSHDB': { description: 'Delete all keys from the current database', syntax: 'FLUSHDB' },
    'DBSIZE': { description: 'Return the number of keys in the current database', syntax: 'DBSIZE' },
    'CLIENT': { description: 'Manage client connections', syntax: 'CLIENT LIST|KILL|SETNAME' },
    'CONFIG': { description: 'Get or set configuration parameters', syntax: 'CONFIG GET|SET parameter [value]' },
    
    // Auth commands
    'AUTH': { description: 'Authenticate to the server', syntax: 'AUTH password' },
    
    // Utility commands
    'HELP': { description: 'Show help information', syntax: 'HELP [command]' },
    'CLEAR': { description: 'Clear the terminal', syntax: 'CLEAR' },
    'EXIT': { description: 'Exit the CLI', syntax: 'EXIT' },
    'QUIT': { description: 'Quit the CLI', syntax: 'QUIT' }
  };

  const quickCommands = [
    'PING', 'INFO', 'DBSIZE', 'KEYS *', 'FLUSHDB', 'HELP'
  ];

  useEffect(() => {
    // Auto-scroll to bottom when new output is added
    if (outputRef.current) {
      const scrollContainer = outputRef.current;
      const shouldScroll = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 50;
      
      if (shouldScroll) {
        // Use setTimeout to ensure the DOM has updated
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 10);
      }
    }
  }, [output]);

  useEffect(() => {
    // Ensure input stays focused and scroll to bottom when input changes
    if (inputRef.current && outputRef.current) {
      inputRef.current.focus();
      // Always scroll to bottom when user is typing
      setTimeout(() => {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }, 10);
    }
  }, [input]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showSuggestions && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        if (e.key === 'ArrowUp') {
          setSelectedSuggestion(prev => 
            prev <= 0 ? suggestions.length - 1 : prev - 1
          );
        } else { // ArrowDown
          setSelectedSuggestion(prev => 
            prev >= suggestions.length - 1 ? 0 : prev + 1
          );
        }
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setInput(history[history.length - 1 - newIndex]);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setInput(history[history.length - 1 - newIndex]);
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setInput('');
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (suggestions.length > 0) {
          const suggestion = suggestions[selectedSuggestion >= 0 ? selectedSuggestion : 0];
          setInput(suggestion.command);
          setShowSuggestions(false);
        }
      }
    };

    const currentInputRef = inputRef.current;
    if (currentInputRef) {
      currentInputRef.addEventListener('keydown', handleKeyDown);
      return () => {
        currentInputRef.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [history, historyIndex, suggestions, selectedSuggestion, showSuggestions, setInput]);

  const updateSuggestions = (value) => {
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const matchingCommands = Object.entries(commands)
      .filter(([cmd]) => cmd.toLowerCase().startsWith(value.toLowerCase()))
      .map(([cmd, info]) => ({
        command: cmd,
        description: info.description,
        syntax: info.syntax
      }));

    setSuggestions(matchingCommands);
    setShowSuggestions(matchingCommands.length > 0);
    setSelectedSuggestion(-1);
  };

  const executeCommand = async (command) => {
    if (!command.trim()) return;

    // Add command to output
    setOutput(prev => [...prev, { type: 'command', text: command }]);

    // Add to history
    setHistory(prev => [command, ...prev.slice(0, 99)]); // Keep last 100 commands
    setHistoryIndex(-1);

    const parts = command.trim().split(/\s+/);
    const cmdName = parts[0].toUpperCase();

    // Handle special commands
    if (cmdName === 'CLEAR') {
      setOutput([]);
      return;
    }

    if (cmdName === 'HELP') {
      if (parts.length === 1) {
        // Show general help
        const helpText = [
          'Available commands:',
          '',
          ...Object.entries(commands).map(([cmd, info]) => 
            `  ${cmd.padEnd(12)} - ${info.description}`
          ),
          '',
          'Type "HELP <command>" for detailed syntax.'
        ];
        setOutput(prev => [...prev, ...helpText.map(text => ({ type: 'info', text }))]);
      } else {
        // Show specific command help
        const helpCmd = parts[1].toUpperCase();
        if (commands[helpCmd]) {
          setOutput(prev => [...prev, 
            { type: 'info', text: `${helpCmd} - ${commands[helpCmd].description}` },
            { type: 'info', text: `Syntax: ${commands[helpCmd].syntax}` }
          ]);
        } else {
          setOutput(prev => [...prev, { type: 'error', text: `Unknown command: ${helpCmd}` }]);
        }
      }
      return;
    }

    if (['EXIT', 'QUIT'].includes(cmdName)) {
      setOutput(prev => [...prev, { type: 'info', text: 'Goodbye!' }]);
      return;
    }

    // Execute command using real database server
    try {
      // Check connection status first
      if (!connectionStatus) {
        setOutput(prev => [...prev, { type: 'error', text: 'Not connected to database. Please connect first.' }]);
        return;
      }

      let response;
      if (window.electronAPI) {
        // Use real IPC commands for all operations
        response = await window.electronAPI.executeCommand(cmdName, parts.slice(1));
      } else {
        // This should never happen in Electron, but provide fallback
        throw new Error('Electron API not available');
      }
      
      if (response.success) {
        // Handle different response formats
        let result = response.result || 'OK';
        if (typeof result === 'object') {
          result = JSON.stringify(result, null, 2);
        }
        setOutput(prev => [...prev, { type: 'output', text: result }]);
      } else {
        setOutput(prev => [...prev, { type: 'error', text: response.error || 'Command failed' }]);
      }
    } catch (error) {
      setOutput(prev => [...prev, { type: 'error', text: `Error: ${error.message}` }]);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    updateSuggestions(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      executeCommand(input);
      setInput('');
      setShowSuggestions(false);
    }
  };

  const handleQuickCommand = (command) => {
    setInput(command);
    inputRef.current?.focus();
  };

  const clearTerminal = () => {
    setOutput([]);
  };

  const copyOutput = () => {
    const text = output.map(line => line.text).join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <CliContainer>
      <CliHeader>
        <div className="header-left">
          <FiTerminal size={20} />
          <h2>Redis CLI</h2>
          <span className={`connection-status ${connectionStatus ? 'connected' : 'disconnected'}`}>
            {connectionStatus ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <div className="header-actions">
          <ActionButton onClick={copyOutput}>
            <FiCopy size={14} />
            Copy
          </ActionButton>
          <ActionButton onClick={clearTerminal}>
            <FiX size={14} />
            Clear
          </ActionButton>
          <ActionButton>
            <FiDownload size={14} />
            Export
          </ActionButton>
          <ActionButton>
            <FiSettings size={14} />
            Settings
          </ActionButton>
        </div>
      </CliHeader>

      <TerminalContainer>
        <TerminalOutput ref={outputRef}>
          {output.map((line, index) => (
            <TerminalLine key={index} className={line.type}>
              {line.type === 'command' && <span className="prompt">redis:6379&gt;</span>}
              {line.text}
            </TerminalLine>
          ))}
        </TerminalOutput>

        <div style={{ position: 'relative' }}>
          {showSuggestions && suggestions.length > 0 && (
            <CommandSuggestions>
              {suggestions.map((suggestion, index) => (
                <SuggestionItem
                  key={suggestion.command}
                  className={index === selectedSuggestion ? 'selected' : ''}
                  onClick={() => {
                    setInput(suggestion.command);
                    setShowSuggestions(false);
                    inputRef.current?.focus();
                  }}
                >
                  <div className="command-name">{suggestion.command}</div>
                  <div className="command-description">{suggestion.description}</div>
                </SuggestionItem>
              ))}
            </CommandSuggestions>
          )}
          
          <form onSubmit={handleSubmit}>
            <TerminalInput>
              <span className="prompt">
                {connectionStatus ? 'redis:6379>' : 'redis:offline>'}
              </span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder={connectionStatus ? "Enter Redis command..." : "Not connected to database"}
                autoFocus
                disabled={!connectionStatus}
              />
            </TerminalInput>
          </form>
        </div>

        <QuickCommands>
          {quickCommands.map(command => (
            <QuickCommand
              key={command}
              onClick={() => handleQuickCommand(command)}
            >
              {command}
            </QuickCommand>
          ))}
        </QuickCommands>
      </TerminalContainer>
    </CliContainer>
  );
};

export default CLI;
