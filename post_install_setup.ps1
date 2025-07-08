# CacheDB Post-Installation Setup Script
# This script handles post-installation tasks for CacheDB

param(
    [string]$InstallPath = "C:\Program Files\CacheDB",
    [switch]$InstallAsService = $false,
    [switch]$StartServer = $false
)

Write-Host "CacheDB Post-Installation Setup" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Function to check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check if running as administrator
if (-not (Test-Administrator)) {
    Write-Host "Error: This script must be run as Administrator" -ForegroundColor Red
    exit 1
}

# Create necessary directories
Write-Host "Creating directories..." -ForegroundColor Yellow
$directories = @(
    "$InstallPath\data",
    "$InstallPath\logs",
    "$InstallPath\config"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "Directory exists: $dir" -ForegroundColor Cyan
    }
}

# Set permissions for data and logs directories
Write-Host "Setting directory permissions..." -ForegroundColor Yellow
$acl = Get-Acl "$InstallPath\data"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("Users", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($accessRule)
Set-Acl "$InstallPath\data" $acl

$acl = Get-Acl "$InstallPath\logs"
$acl.SetAccessRule($accessRule)
Set-Acl "$InstallPath\logs" $acl

Write-Host "Permissions set successfully" -ForegroundColor Green

# Create default configuration if it doesn't exist
$configPath = "$InstallPath\config.json"
if (-not (Test-Path $configPath)) {
    Write-Host "Creating default configuration..." -ForegroundColor Yellow
    $defaultConfig = @{
        port = 6379
        cache_size = 1000
        cache_policy = "ARC"
        api_key = ""
        password = "your_strong_password_here"
        cert_path = ""
        key_path = ""
        cluster_nodes = @()
    } | ConvertTo-Json -Depth 10
    
    $defaultConfig | Out-File -FilePath $configPath -Encoding UTF8
    Write-Host "Default configuration created: $configPath" -ForegroundColor Green
}

# Install Python dependencies for web interface
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
$webInterfacePath = "$InstallPath\web_interface"
if (Test-Path "$webInterfacePath\requirements.txt") {
    try {
        python -m pip install -r "$webInterfacePath\requirements.txt" --quiet
        Write-Host "Python dependencies installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "Warning: Failed to install Python dependencies. You may need to install them manually." -ForegroundColor Yellow
    }
}

# Install as Windows Service if requested
if ($InstallAsService) {
    Write-Host "Installing CacheDB as Windows Service..." -ForegroundColor Yellow
    
    # Check if NSSM is available (Non-Sucking Service Manager)
    $nssmPath = "$InstallPath\nssm.exe"
    if (-not (Test-Path $nssmPath)) {
        Write-Host "Downloading NSSM..." -ForegroundColor Yellow
        $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
        $tempZip = "$env:TEMP\nssm.zip"
        
        try {
            Invoke-WebRequest -Uri $nssmUrl -OutFile $tempZip
            Expand-Archive -Path $tempZip -DestinationPath "$env:TEMP\nssm" -Force
            Copy-Item "$env:TEMP\nssm\nssm-2.24\win64\nssm.exe" -Destination $nssmPath
            Remove-Item $tempZip -Force
            Remove-Item "$env:TEMP\nssm" -Recurse -Force
        } catch {
            Write-Host "Error: Failed to download NSSM. Service installation skipped." -ForegroundColor Red
            $InstallAsService = $false
        }
    }
    
    if ($InstallAsService) {
        try {
            # Install the service
            & $nssmPath install "CacheDB" "$InstallPath\mydb_server.exe"
            & $nssmPath set "CacheDB" AppDirectory "$InstallPath"
            & $nssmPath set "CacheDB" Description "CacheDB - High-performance Redis-like in-memory database"
            & $nssmPath set "CacheDB" Start SERVICE_AUTO_START
            
            Write-Host "CacheDB service installed successfully" -ForegroundColor Green
            Write-Host "You can start the service with: Start-Service CacheDB" -ForegroundColor Cyan
        } catch {
            Write-Host "Error: Failed to install CacheDB service" -ForegroundColor Red
        }
    }
}

# Start server if requested
if ($StartServer) {
    Write-Host "Starting CacheDB server..." -ForegroundColor Yellow
    try {
        Start-Process -FilePath "$InstallPath\mydb_server.exe" -WorkingDirectory $InstallPath -WindowStyle Minimized
        Write-Host "CacheDB server started successfully" -ForegroundColor Green
    } catch {
        Write-Host "Error: Failed to start CacheDB server" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Post-installation setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit the configuration file: $configPath" -ForegroundColor White
Write-Host "2. Start the server: $InstallPath\mydb_server.exe" -ForegroundColor White
Write-Host "3. Access the web interface: http://localhost:5000" -ForegroundColor White
Write-Host "4. Use the client: $InstallPath\mydb.exe" -ForegroundColor White

if ($InstallAsService) {
    Write-Host "5. Manage the service: Start-Service CacheDB / Stop-Service CacheDB" -ForegroundColor White
}

Write-Host ""
Write-Host "For more information, see: $InstallPath\README.md" -ForegroundColor Cyan 