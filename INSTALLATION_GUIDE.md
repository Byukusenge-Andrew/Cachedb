# CacheDB Installation Guide

This guide explains how to build and use the CacheDB installer for Windows.

## Prerequisites

### For Building the Installer

1. **Inno Setup Compiler** (version 6.0 or higher)
   - Download from: https://jrsoftware.org/isinfo.php
   - Install and ensure `iscc.exe` is in your PATH

2. **Python** (3.7 or higher)
   - Required for the web interface
   - Download from: https://www.python.org/downloads/

3. **Built Executables**
   - Ensure `mydb_server.exe` and `mydb.exe` are built in the `build/` directory
   - Run `cmake --build .` in the build directory if needed

### For End Users

1. **Windows 10/11** (64-bit)
2. **Administrator privileges** (for installation)
3. **Python 3.7+** (for web interface)

## Building the Installer

### Method 1: Using the Batch File (Recommended)

1. Open Command Prompt in the project root directory
2. Run the batch file:
   ```cmd
   build_installer.bat
   ```

### Method 2: Manual Build

1. Open Command Prompt in the project root directory
2. Run Inno Setup Compiler:
   ```cmd
   iscc installer.iss
   ```

The installer will be created in the `installer_output/` directory as `CacheDB_Setup_1.0.0.exe`.

## Installation Process

### Step 1: Run the Installer

1. Double-click `CacheDB_Setup_1.0.0.exe`
2. Click "Yes" when prompted by User Account Control
3. Follow the installation wizard

### Step 2: Installation Options

The installer provides several options:

- **Installation Directory**: Choose where to install CacheDB (default: `C:\Program Files\CacheDB`)
- **Start Menu Group**: Choose the name for the Start Menu group
- **Desktop Icon**: Create a desktop shortcut for the server
- **Start Server After Installation**: Automatically start the server when installation completes
- **Install as Windows Service**: Install CacheDB as a Windows service (requires NSSM)

### Step 3: Post-Installation Setup

After installation, you may need to:

1. **Configure the Database**:
   - Edit `config.json` in the installation directory
   - Set your desired port, cache size, and password
   - Add your Google Gemini API key for AI optimization

2. **Start the Server**:
   - Use the Start Menu shortcut: `CacheDB Server`
   - Or run: `C:\Program Files\CacheDB\mydb_server.exe`

3. **Access the Web Interface**:
   - Open: http://localhost:5000
   - Default credentials may be required (check the web interface documentation)

## File Structure After Installation

```
C:\Program Files\CacheDB\
├── mydb_server.exe          # Main server executable
├── mydb.exe                 # Client executable
├── config.json              # Server configuration
├── db.json                  # Database file
├── README.md                # Documentation
├── connect_db.ps1           # PowerShell connection script
├── post_install_setup.ps1   # Post-installation setup script
├── web_interface\           # Web UI files
│   ├── app.py
│   ├── requirements.txt
│   └── templates\
├── data\                    # Database data directory
│   └── db.aof
└── logs\                    # Log files directory
```

## Configuration

### Server Configuration (`config.json`)

```json
{
  "port": 6379,
  "cache_size": 1000,
  "cache_policy": "ARC",
  "api_key": "YOUR_GOOGLE_GEMINI_API_KEY",
  "password": "your_strong_password_here",
  "cert_path": "",
  "key_path": "",
  "cluster_nodes": []
}
```

### Configuration Options

- **port**: Server port (default: 6379)
- **cache_size**: Maximum number of items in cache (default: 1000)
- **cache_policy**: Cache replacement policy ("LRU", "LFU", or "ARC")
- **api_key**: Google Gemini API key for AI optimization
- **password**: Server authentication password
- **cert_path**: Path to SSL certificate (for HTTPS)
- **key_path**: Path to SSL private key
- **cluster_nodes**: Array of cluster node addresses

## Usage

### Starting the Server

1. **Manual Start**:
   ```cmd
   "C:\Program Files\CacheDB\mydb_server.exe"
   ```

2. **As Windows Service** (if installed):
   ```powershell
   Start-Service CacheDB
   ```

3. **Using PowerShell Script**:
   ```powershell
   & "C:\Program Files\CacheDB\connect_db.ps1"
   ```

### Using the Client

```cmd
"C:\Program Files\CacheDB\mydb.exe"
```

### Web Interface

1. Start the web interface:
   ```cmd
   cd "C:\Program Files\CacheDB\web_interface"
   python app.py
   ```

2. Open your browser and navigate to: http://localhost:5000

## Troubleshooting

### Common Issues

1. **"Access Denied" Errors**:
   - Run the installer as Administrator
   - Check file permissions in the installation directory

2. **Python Dependencies Not Installed**:
   - Manually install: `pip install -r "C:\Program Files\CacheDB\web_interface\requirements.txt"`

3. **Port Already in Use**:
   - Change the port in `config.json`
   - Or stop the existing service using the port

4. **Service Installation Fails**:
   - Ensure you have Administrator privileges
   - Check if NSSM was downloaded correctly
   - Try manual service installation

### Logs

Check the logs directory for error information:
```
C:\Program Files\CacheDB\logs\
```

### Uninstallation

1. **Using Control Panel**:
   - Go to Programs and Features
   - Select "CacheDB" and click Uninstall

2. **Using PowerShell** (if installed as service):
   ```powershell
   Stop-Service CacheDB
   Remove-Service CacheDB
   ```

3. **Manual Cleanup**:
   - Delete the installation directory
   - Remove registry entries (use the uninstaller)

## Support

For issues and questions:

1. Check the README.md file in the installation directory
2. Review the logs in the logs directory
3. Check the project repository: https://github.com/Byukusenge_Andrew/CacheDB

## Security Notes

1. **Change Default Password**: Always change the default password in `config.json`
2. **API Key Security**: Keep your Google Gemini API key secure
3. **SSL/TLS**: Use SSL certificates for production deployments
4. **Firewall**: Configure your firewall to allow connections on the configured port
5. **Service Account**: Consider using a dedicated service account for the Windows service

## Performance Tuning

1. **Cache Size**: Adjust `cache_size` based on available memory
2. **Cache Policy**: Choose the appropriate policy for your workload:
   - **LRU**: Good for most workloads
   - **LFU**: Better for frequently accessed items
   - **ARC**: Adaptive, good for mixed workloads
3. **Persistence**: Monitor the size of `db.aof` and `db.json` files
4. **Clustering**: Add cluster nodes for distributed deployments 