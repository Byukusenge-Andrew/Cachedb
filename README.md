# CacheDB

CacheDB is a high-performance, Redis-like in-memory database featuring advanced caching policies (LRU/LFU/ARC), HyperLogLog cardinality estimation, Pub/Sub messaging, clustering support, SSL/TLS encryption, and AI-driven optimization. Built with modern C++ and designed for scalability and performance.

## 🚀 Features

- **Multiple Cache Policies**: LRU, LFU, and ARC (Adaptive Replacement Cache)
- **HyperLogLog**: Cardinality estimation for large datasets
- **Pub/Sub Messaging**: Real-time publish/subscribe functionality
- **Clustering Support**: Distributed database across multiple nodes
- **SSL/TLS Encryption**: Secure client-server communication
- **AI Optimization**: Intelligent cache policy and size optimization using Google Gemini
- **Web Interface**: Modern web UI for database management
- **Persistence**: JSON-based data persistence with optional encryption
- **Authentication**: Password-based client authentication
- **Cross-Platform**: Windows, Linux, and macOS support

## Project Structure

```
mydb/
├── CMakeLists.txt          # CMake build configuration
├── config.json             # Server configuration
├── db.json                 # Database persistence file
├── db.aof                  # Append-only file for persistence
├── .gitignore             # Git ignore rules
├── README.md              # This file
├── Makefile               # Alternative build system
├── connect_db.ps1         # PowerShell connection script
├── include/               # Header files
│   ├── db.h              # Main database interface
│   ├── json.hpp          # JSON library
│   ├── lfu_cache.h       # LFU cache implementation
│   ├── lru_cache.h       # LRU cache implementation
│   ├── arc_cache.h       # ARC cache implementation
│   ├── hyperloglog.h     # HyperLogLog implementation
│   ├── cluster.h         # Clustering functionality
│   ├── pubsub.h          # Pub/Sub messaging
│   └── plusaes.hpp       # AES encryption library
├── src/                  # Source files
│   ├── db.cpp            # Database implementation
│   ├── main.cpp          # Client application
│   ├── server.cpp        # Server application
│   ├── lru_cache.cpp     # LRU cache implementation
│   ├── lfu_cache.cpp     # LFU cache implementation
│   ├── arc_cache.cpp     # ARC cache implementation
│   ├── hyperloglog.cpp   # HyperLogLog implementation
│   ├── cluster.cpp       # Clustering implementation
│   └── pubsub.cpp        # Pub/Sub implementation
├── web_interface/        # Web UI
│   ├── app.py           # Flask web application
│   ├── templates/       # HTML templates
│   └── static/          # CSS/JS assets
└── crow/                # Crow web framework (if used)
```

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   CMake (version 3.10 or higher)
*   A C++ compiler (e.g., MinGW-w64 GCC for Windows, g++ for Linux/macOS)
*   `libcurl` development libraries (for the AI optimization feature)
*   OpenSSL development libraries (for SSL/TLS encryption)
*   Python 3.7+ with Flask (for web interface)

### Building the Project

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Byukusenge_Andrew/CacheDB.git
    cd CacheDB
    ```

2.  **Create a build directory and configure CMake:**
    ```bash
    mkdir build
    cd build
    cmake -G "MinGW Makefiles" -B build
    ```

3.  **Build the executables:**
    ```bash
    cmake --build .
    ```
    This will generate `mydb.exe` (client) and `mydb_server.exe` (server) in the `build/` directory.

### Configuration

Before running the server, you need to create a `config.json` file in the root directory of the project (`mydb/`). This file is crucial for server operation and security, and **it is intentionally ignored by Git to prevent sensitive information from 

Create a file named `config.json` with the following content:

```json
{
    "port": 6379,
    "cache_size": 10,
    "cache_policy": "ARC",
    "api_key": "YOUR_GOOGLE_GEMINI_API_KEY",
    "password": "your_strong_server_password",
    "cluster_nodes": [],
    "cert_path": "",
    "key_path": ""
}
```



## Contributions

Developed by Byukusenge_Andrew. 