# MyRedisDB

MyRedisDB is a lightweight, in-memory key-value store inspired by Redis, featuring pluggable caching policies (LRU/LFU), persistence to disk, and an AI-driven optimization loop for cache management. It also includes basic password authentication for clients and encrypted data storage.

## Project Structure

```
mydb/
  - CMakeLists.txt
  - config.json
  - db.json
  - .gitignore
  - include/
    - db.h
    - json.hpp
    - lfu_cache.h
    - lru_cache.h
    - plusaes.hpp
  - src/
    - db.cpp
    - lfu_cache.cpp
    - lru_cache.cpp
    - main.cpp
    - server.cpp
```

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   CMake (version 3.10 or higher)
*   A C++ compiler (e.g., MinGW-w64 GCC for Windows, g++ for Linux/macOS)
*   `libcurl` development libraries (for the AI optimization feature)

### Building the Project

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Byukusenge_Andrew/MyRedisDB.git
    cd MyRedisDB
    ```

2.  **Create a build directory and configure CMake:**
    ```bash
    mkdir build
    cd build
    cmake -G "MinGW Makefiles" .. # On Windows with MinGW
    # or
    # cmake .. # On Linux/macOS
    ```

3.  **Build the executables:**
    ```bash
    cmake --build .
    ```
    This will generate `mydb.exe` (client) and `mydb_server.exe` (server) in the `build/` directory.

### Configuration

Before running the server, you need to create a `config.json` file in the root directory of the project (`mydb/`). This file is crucial for server operation and security, and **it is intentionally ignored by Git to prevent sensitive information from being committed to the repository.**

Create a file named `config.json` with the following content:

```json
{
    "port": 6379,
    "cache_size": 100,
    "cache_policy": "LRU",
    "api_key": "YOUR_GOOGLE_GEMINI_API_KEY",
    "password": "your_strong_server_password"
}
```

*   `port`: The port on which the server will listen.
*   `cache_size`: The maximum number of items the cache will store.
*   `cache_policy`: The cache eviction policy, either "LRU" or "LFU".
*   `api_key`: Your API key for Google Gemini, used for AI-driven cache optimizations. **Replace `YOUR_GOOGLE_GEMINI_API_KEY` with your actual API key.** If you don't have one or don't want this feature, you can leave it empty or remove the line.
*   `password`: The password required for clients to authenticate with the server. **Replace `your_strong_server_password` with a strong, unique password.** If left empty, no authentication will be required.

### Running the Server

Open a terminal in the project root directory (`mydb/`) and run:

```bash
.\build\mydb_server.exe
```
(or `./build/mydb_server` on Linux/macOS)

### Interacting with the Server (Client)

Open another terminal in the project root directory (`mydb/`) and run:

```bash
.\build\mydb.exe
```
(or `./build/mydb` on Linux/macOS)

Once the client starts, you will see a `>` prompt. If a password is set in `config.json`, your first command must be to authenticate:

```
AUTH your_strong_server_password
```

After successful authentication, you can use the following commands:

*   `SET <key> <value>`: Stores a string value. Example: `SET mykey myvalue`
*   `GET <key>`: Retrieves the value of a key. Example: `GET mykey`
*   `DEL <key>`: Deletes a key. Example: `DEL mykey`
*   `EXPIRE <key> <seconds>`: Sets a time-to-live for a key. Example: `EXPIRE mykey 60`
*   `SAVE`: Saves the current database to `db.json` (encrypted).
*   `LOAD`: Loads the database from `db.json` (decrypted).
*   `QUIT` or `EXIT`: Closes the client connection.
*   `HELP`: Displays command usage.

## Security Notes

*   **Authentication:** The server now requires a password for client connections if specified in `config.json`. Ensure you set a strong password.
*   **Encrypted `db.json`:** The `db.json` file is encrypted when saved and decrypted when loaded, providing a layer of protection for your data at rest. The encryption key is currently hardcoded in `src/db.cpp`. For production environments, a more secure key management solution (e.g., environment variables, HSM) is highly recommended.

## Contributions

Developed by Byukusenge_Andrew. 