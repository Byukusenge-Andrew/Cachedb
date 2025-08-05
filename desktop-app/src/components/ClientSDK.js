import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  FiCode, FiDownload, FiCopy, FiPlay, FiCheck,
  FiExternalLink, FiBook, FiPackage, FiGithub
} from 'react-icons/fi';

const ClientContainer = styled.div`
  padding: 30px;
  overflow-y: auto;
  height: 100vh;
  background-color: ${props => props.theme.colors.background};
`;

const ClientHeader = styled.div`
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
    margin-bottom: 20px;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 30px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const Tab = styled.button`
  padding: 12px 20px;
  border: none;
  border-bottom: 2px solid ${props => props.active ? props.theme.colors.primary : 'transparent'};
  background-color: transparent;
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: ${props => props.theme.transition};
  
  &:hover {
    color: ${props => props.theme.colors.text};
  }
`;

const LanguageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const LanguageCard = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  padding: 24px;
  
  .language-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    
    .language-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .language-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: ${props => props.color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 16px;
      }
      
      h3 {
        font-size: 18px;
        font-weight: 600;
        color: ${props => props.theme.colors.text};
        margin: 0;
      }
    }
    
    .language-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .language-description {
    font-size: 14px;
    color: ${props => props.theme.colors.textSecondary};
    margin-bottom: 16px;
  }
  
  .installation {
    margin-bottom: 16px;
    
    .install-label {
      font-size: 12px;
      color: ${props => props.theme.colors.textSecondary};
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 6px;
    }
    
    .install-command {
      background-color: ${props => props.theme.colors.background};
      border: 1px solid ${props => props.theme.colors.border};
      border-radius: ${props => props.theme.borderRadius};
      padding: 10px 12px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 13px;
      color: ${props => props.theme.colors.text};
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      .copy-btn {
        background: none;
        border: none;
        color: ${props => props.theme.colors.textSecondary};
        cursor: pointer;
        padding: 4px;
        
        &:hover {
          color: ${props => props.theme.colors.text};
        }
      }
    }
  }
`;

const ActionButton = styled.button`
  padding: 8px 12px;
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
`;

const CodeSection = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  overflow: hidden;
  margin-bottom: 20px;
  
  .code-header {
    padding: 12px 16px;
    background-color: ${props => props.theme.colors.background};
    border-bottom: 1px solid ${props => props.theme.colors.border};
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .code-title {
      font-size: 14px;
      font-weight: 500;
      color: ${props => props.theme.colors.text};
    }
    
    .code-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .code-content {
    padding: 16px;
    
    pre {
      margin: 0;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 13px;
      line-height: 1.5;
      color: ${props => props.theme.colors.text};
      white-space: pre-wrap;
      word-break: break-word;
    }
  }
`;

const ExampleSection = styled.div`
  margin-bottom: 30px;
  
  h2 {
    font-size: 20px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 16px;
  }
`;

const ClientSDK = () => {
  const [activeTab, setActiveTab] = useState('libraries');
  const [copiedCommand, setCopiedCommand] = useState(null);

  const languages = [
    {
      name: 'JavaScript/Node.js',
      icon: 'JS',
      color: '#f7df1e',
      description: 'Full-featured client for Node.js and browser environments',
      installCommand: 'npm install cachedb-client',
      packageUrl: 'https://npmjs.com/package/cachedb-client',
      githubUrl: 'https://github.com/cachedb/node-client'
    },
    {
      name: 'Python',
      icon: 'PY',
      color: '#3776ab',
      description: 'Python client with async/await support and connection pooling',
      installCommand: 'pip install cachedb-python',
      packageUrl: 'https://pypi.org/project/cachedb-python/',
      githubUrl: 'https://github.com/cachedb/python-client'
    },
    {
      name: 'Java',
      icon: 'JA',
      color: '#ed8b00',
      description: 'High-performance Java client with reactive streams support',
      installCommand: 'implementation "com.cachedb:cachedb-java:1.0.0"',
      packageUrl: 'https://mvnrepository.com/artifact/com.cachedb/cachedb-java',
      githubUrl: 'https://github.com/cachedb/java-client'
    },
    {
      name: 'Go',
      icon: 'GO',
      color: '#00add8',
      description: 'Lightweight Go client with context support and connection pooling',
      installCommand: 'go get github.com/cachedb/go-client',
      packageUrl: 'https://pkg.go.dev/github.com/cachedb/go-client',
      githubUrl: 'https://github.com/cachedb/go-client'
    },
    {
      name: 'Rust',
      icon: 'RS',
      color: '#000000',
      description: 'Safe and fast Rust client with tokio async runtime',
      installCommand: 'cargo add cachedb-client',
      packageUrl: 'https://crates.io/crates/cachedb-client',
      githubUrl: 'https://github.com/cachedb/rust-client'
    },
    {
      name: 'C#/.NET',
      icon: 'C#',
      color: '#512bd4',
      description: '.NET client with async/await and dependency injection support',
      installCommand: 'dotnet add package CacheDB.Client',
      packageUrl: 'https://nuget.org/packages/CacheDB.Client',
      githubUrl: 'https://github.com/cachedb/dotnet-client'
    }
  ];

  const codeExamples = {
    javascript: `// JavaScript/Node.js Example
const CacheDB = require('cachedb-client');

// Connect to CacheDB
const client = new CacheDB({
  host: 'localhost',
  port: 6379,
  password: 'your-password'
});

// Basic operations
async function example() {
  // Set a value
  await client.set('user:1', { name: 'John', age: 30 });
  
  // Get a value
  const user = await client.get('user:1');
  console.log(user); // { name: 'John', age: 30 }
  
  // List operations
  await client.lpush('tasks', 'task1', 'task2');
  const tasks = await client.lrange('tasks', 0, -1);
  
  // Hash operations
  await client.hset('settings', 'theme', 'dark');
  await client.hset('settings', 'lang', 'en');
  const settings = await client.hgetall('settings');
  
  // Pub/Sub
  const subscriber = client.createSubscriber();
  subscriber.subscribe('notifications');
  subscriber.on('message', (channel, message) => {
    console.log(\`Received: \${message} on \${channel}\`);
  });
  
  await client.publish('notifications', 'Hello World!');
}`,

    python: `# Python Example
import asyncio
from cachedb import CacheDB

async def main():
    # Connect to CacheDB
    client = CacheDB(host='localhost', port=6379, password='your-password')
    
    # Basic operations
    await client.set('user:1', {'name': 'John', 'age': 30})
    user = await client.get('user:1')
    print(user)  # {'name': 'John', 'age': 30}
    
    # List operations
    await client.lpush('tasks', 'task1', 'task2')
    tasks = await client.lrange('tasks', 0, -1)
    
    # Hash operations
    await client.hset('settings', 'theme', 'dark')
    await client.hset('settings', 'lang', 'en')
    settings = await client.hgetall('settings')
    
    # Pub/Sub
    async def message_handler(channel, message):
        print(f"Received: {message} on {channel}")
    
    await client.subscribe('notifications', message_handler)
    await client.publish('notifications', 'Hello World!')
    
    await client.close()

# Run the example
asyncio.run(main())`,

    java: `// Java Example
import com.cachedb.client.CacheDBClient;
import com.cachedb.client.model.ConnectionConfig;

public class CacheDBExample {
    public static void main(String[] args) {
        // Connect to CacheDB
        ConnectionConfig config = ConnectionConfig.builder()
            .host("localhost")
            .port(6379)
            .password("your-password")
            .build();
            
        CacheDBClient client = new CacheDBClient(config);
        
        // Basic operations
        client.set("user:1", Map.of("name", "John", "age", 30));
        Map<String, Object> user = client.get("user:1", Map.class);
        System.out.println(user); // {name=John, age=30}
        
        // List operations
        client.lpush("tasks", "task1", "task2");
        List<String> tasks = client.lrange("tasks", 0, -1);
        
        // Hash operations
        client.hset("settings", "theme", "dark");
        client.hset("settings", "lang", "en");
        Map<String, String> settings = client.hgetall("settings");
        
        // Pub/Sub
        client.subscribe("notifications", (channel, message) -> {
            System.out.println("Received: " + message + " on " + channel);
        });
        
        client.publish("notifications", "Hello World!");
        
        client.close();
    }
}`
  };

  const handleCopyCommand = (command) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const tabs = [
    { id: 'libraries', label: 'Client Libraries' },
    { id: 'examples', label: 'Code Examples' },
    { id: 'docs', label: 'Documentation' }
  ];

  const renderLibraries = () => (
    <LanguageGrid>
      {languages.map(lang => (
        <LanguageCard key={lang.name} color={lang.color}>
          <div className="language-header">
            <div className="language-info">
              <div className="language-icon">{lang.icon}</div>
              <h3>{lang.name}</h3>
            </div>
            <div className="language-actions">
              <ActionButton onClick={() => window.open(lang.githubUrl)}>
                <FiGithub size={12} />
              </ActionButton>
              <ActionButton onClick={() => window.open(lang.packageUrl)}>
                <FiExternalLink size={12} />
              </ActionButton>
            </div>
          </div>
          
          <div className="language-description">{lang.description}</div>
          
          <div className="installation">
            <div className="install-label">Installation</div>
            <div className="install-command">
              <code>{lang.installCommand}</code>
              <button 
                className="copy-btn"
                onClick={() => handleCopyCommand(lang.installCommand)}
              >
                {copiedCommand === lang.installCommand ? <FiCheck size={14} /> : <FiCopy size={14} />}
              </button>
            </div>
          </div>
          
          <ActionButton className="primary">
            <FiDownload size={12} />
            Get Started
          </ActionButton>
        </LanguageCard>
      ))}
    </LanguageGrid>
  );

  const renderExamples = () => (
    <div>
      <ExampleSection>
        <h2>JavaScript/Node.js</h2>
        <CodeSection>
          <div className="code-header">
            <span className="code-title">Basic Usage Example</span>
            <div className="code-actions">
              <ActionButton onClick={() => handleCopyCommand(codeExamples.javascript)}>
                <FiCopy size={12} />
                Copy
              </ActionButton>
              <ActionButton>
                <FiPlay size={12} />
                Run
              </ActionButton>
            </div>
          </div>
          <div className="code-content">
            <pre>{codeExamples.javascript}</pre>
          </div>
        </CodeSection>
      </ExampleSection>

      <ExampleSection>
        <h2>Python</h2>
        <CodeSection>
          <div className="code-header">
            <span className="code-title">Async/Await Example</span>
            <div className="code-actions">
              <ActionButton onClick={() => handleCopyCommand(codeExamples.python)}>
                <FiCopy size={12} />
                Copy
              </ActionButton>
            </div>
          </div>
          <div className="code-content">
            <pre>{codeExamples.python}</pre>
          </div>
        </CodeSection>
      </ExampleSection>

      <ExampleSection>
        <h2>Java</h2>
        <CodeSection>
          <div className="code-header">
            <span className="code-title">Spring Boot Integration</span>
            <div className="code-actions">
              <ActionButton onClick={() => handleCopyCommand(codeExamples.java)}>
                <FiCopy size={12} />
                Copy
              </ActionButton>
            </div>
          </div>
          <div className="code-content">
            <pre>{codeExamples.java}</pre>
          </div>
        </CodeSection>
      </ExampleSection>
    </div>
  );

  const renderDocs = () => (
    <LanguageGrid>
      <LanguageCard color="#3498db">
        <div className="language-header">
          <div className="language-info">
            <div className="language-icon"><FiBook size={20} /></div>
            <h3>API Reference</h3>
          </div>
        </div>
        <div className="language-description">
          Complete API documentation with all available methods and parameters.
        </div>
        <ActionButton className="primary">
          <FiExternalLink size={12} />
          View Docs
        </ActionButton>
      </LanguageCard>

      <LanguageCard color="#2ecc71">
        <div className="language-header">
          <div className="language-info">
            <div className="language-icon"><FiCode size={20} /></div>
            <h3>Tutorials</h3>
          </div>
        </div>
        <div className="language-description">
          Step-by-step guides for building applications with CacheDB.
        </div>
        <ActionButton className="primary">
          <FiExternalLink size={12} />
          Start Learning
        </ActionButton>
      </LanguageCard>

      <LanguageCard color="#9b59b6">
        <div className="language-header">
          <div className="language-info">
            <div className="language-icon"><FiPackage size={20} /></div>
            <h3>SDK Downloads</h3>
          </div>
        </div>
        <div className="language-description">
          Download pre-built SDKs and tools for your development environment.
        </div>
        <ActionButton className="primary">
          <FiDownload size={12} />
          Download
        </ActionButton>
      </LanguageCard>
    </LanguageGrid>
  );

  return (
    <ClientContainer>
      <ClientHeader>
        <h1>Client SDKs & Libraries</h1>
        <p>Connect to CacheDB from any programming language with our official client libraries</p>
        
        <TabsContainer>
          {tabs.map(tab => (
            <Tab
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Tab>
          ))}
        </TabsContainer>
      </ClientHeader>

      {activeTab === 'libraries' && renderLibraries()}
      {activeTab === 'examples' && renderExamples()}
      {activeTab === 'docs' && renderDocs()}
    </ClientContainer>
  );
};

export default ClientSDK;
