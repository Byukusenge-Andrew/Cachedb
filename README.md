# CacheDB

CacheDB is a high-performance, Redis-like in-memory database featuring a multi-project and multi-database architecture, advanced caching policies (LRU/LFU/ARC), HyperLogLog cardinality estimation, Pub/Sub messaging, clustering support, SSL/TLS encryption, and AI-driven optimization. Built with modern C++ and designed for scalability and performance.

## 🚀 Features

- **Multi-Project & Multi-Database**: Organize your data across different projects and databases.
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
├── data/                    # Default data directory
│   ├── project_one/
│   │   ├── db_one.json
│   │   └── db_two.json
│   └── project_two/
│       └── db_three.json
├── CMakeLists.txt          # CMake build configuration
├── config.json             # Server configuration
├── db.json                 # Database persistence file
├── db.aof                  # Append-only file for persistence
├── .gitignore             # Git ignore rules
├── README.md              # This file
├── Makefile               # Alternative build system
├── connect_db.ps1         # PowerShell connection script
├── include/               # Header files
│   ├── db.h               # Main database interface
│   ├── project_manager.h  # Project and database management
│   ├── json.hpp           # JSON library
│   ├── lfu_cache.h       # LFU cache implementation
│   ├── lru_cache.h       # LRU cache implementation
│   ├── arc_cache.h       # ARC cache implementation
│   ├── hyperloglog.h     # HyperLogLog implementation
│   ├── cluster.h         # Clustering functionality
│   ├── pubsub.h          # Pub/Sub messaging
│   └── plusaes.hpp       # AES encryption library
├── src/                  # Source files
│   ├── db.cpp             # Database implementation
│   ├── project_manager.cpp# Project manager implementation
│   ├── main.cpp           # Client application
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
    "password": "your_strong_server_password",
    "data_directory": "data",
    "cert_path": "",
    "key_path": ""
}
```

## New Commands

- `CREATE_PROJECT <project_name>`: Creates a new project.
- `LIST_PROJECTS`: Lists all available projects.
- `CREATE_DATABASE <db_name> IN <project_name>`: Creates a new database within a project.
- `LIST_DATABASES IN <project_name>`: Lists all databases in a project.
- `USE <project_name> <db_name>`: Selects a project and database to work with.
- `GET_ALL`: Returns all key-value pairs in the current database as a JSON string.

All standard commands like `SET`, `GET`, `DEL`, etc., now operate on the database selected with the `USE` command.

## Contributions

Developed by Byukusenge_Andrew. 