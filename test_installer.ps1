# CacheDB Installer Test Script
# This script tests the installer build and validates the installation

param(
    [switch]$BuildOnly = $false,
    [switch]$TestInstall = $false,
    [string]$TestInstallPath = "C:\Temp\CacheDB_Test"
)

Write-Host "CacheDB Installer Test Script" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Function to check if Inno Setup is installed
function Test-InnoSetup {
    try {
        $null = Get-Command iscc -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Function to check if required files exist
function Test-RequiredFiles {
    $requiredFiles = @(
        "build\mydb_server.exe",
        "build\mydb.exe",
        "config.json",
        "web_interface\app.py",
        "web_interface\requirements.txt",
        "web_interface\templates\index.html",
        "README.md",
        "connect_db.ps1"
    )
    
    $missingFiles = @()
    
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            $missingFiles += $file
        }
    }
    
    return $missingFiles
}

# Function to build the installer
function Build-Installer {
    Write-Host "Building installer..." -ForegroundColor Yellow
    
    if (-not (Test-InnoSetup)) {
        Write-Host "Error: Inno Setup Compiler (iscc) not found in PATH" -ForegroundColor Red
        Write-Host "Please install Inno Setup from: https://jrsoftware.org/isinfo.php" -ForegroundColor Yellow
        return $false
    }
    
    # Create installer output directory
    if (-not (Test-Path "installer_output")) {
        New-Item -ItemType Directory -Path "installer_output" -Force | Out-Null
    }
    
    # Build the installer
    try {
        $result = & iscc installer.iss
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Installer built successfully!" -ForegroundColor Green
            Write-Host "Output: installer_output\CacheDB_Setup_1.0.0.exe" -ForegroundColor Cyan
            return $true
        } else {
            Write-Host "Error: Failed to build installer" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "Error: Exception during installer build" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $false
    }
}

# Function to test installation
function Test-Installation {
    param([string]$InstallPath)
    
    Write-Host "Testing installation..." -ForegroundColor Yellow
    
    $installerPath = "installer_output\CacheDB_Setup_1.0.0.exe"
    if (-not (Test-Path $installerPath)) {
        Write-Host "Error: Installer not found at $installerPath" -ForegroundColor Red
        return $false
    }
    
    # Check if test directory exists and clean it
    if (Test-Path $InstallPath) {
        Write-Host "Removing existing test installation..." -ForegroundColor Yellow
        Remove-Item -Path $InstallPath -Recurse -Force
    }
    
    # Run installer in silent mode
    Write-Host "Running installer in silent mode..." -ForegroundColor Yellow
    try {
        $process = Start-Process -FilePath $installerPath -ArgumentList "/SILENT", "/DIR=$InstallPath" -Wait -PassThru
        if ($process.ExitCode -eq 0) {
            Write-Host "Installation completed successfully" -ForegroundColor Green
        } else {
            Write-Host "Error: Installation failed with exit code $($process.ExitCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "Error: Exception during installation" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $false
    }
    
    # Verify installation
    Write-Host "Verifying installation..." -ForegroundColor Yellow
    $requiredInstalledFiles = @(
        "$InstallPath\mydb_server.exe",
        "$InstallPath\mydb.exe",
        "$InstallPath\config.json",
        "$InstallPath\README.md",
        "$InstallPath\web_interface\app.py"
    )
    
    $missingFiles = @()
    foreach ($file in $requiredInstalledFiles) {
        if (-not (Test-Path $file)) {
            $missingFiles += $file
        }
    }
    
    if ($missingFiles.Count -gt 0) {
        Write-Host "Error: Missing files after installation:" -ForegroundColor Red
        foreach ($file in $missingFiles) {
            Write-Host "  - $file" -ForegroundColor Red
        }
        return $false
    }
    
    Write-Host "Installation verification passed!" -ForegroundColor Green
    
    # Test server startup
    Write-Host "Testing server startup..." -ForegroundColor Yellow
    try {
        $serverProcess = Start-Process -FilePath "$InstallPath\mydb_server.exe" -WindowStyle Minimized -PassThru
        Start-Sleep -Seconds 3
        
        if (-not $serverProcess.HasExited) {
            Write-Host "Server started successfully" -ForegroundColor Green
            $serverProcess.Kill()
            Start-Sleep -Seconds 1
        } else {
            Write-Host "Warning: Server process exited unexpectedly" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Warning: Could not test server startup" -ForegroundColor Yellow
    }
    
    return $true
}

# Main execution
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check required files
$missingFiles = Test-RequiredFiles
if ($missingFiles.Count -gt 0) {
    Write-Host "Error: Missing required files:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "  - $file" -ForegroundColor Red
    }
    exit 1
}

Write-Host "All required files found" -ForegroundColor Green

# Build installer
if (-not $BuildOnly) {
    $buildSuccess = Build-Installer
    if (-not $buildSuccess) {
        exit 1
    }
}

# Test installation
if ($TestInstall) {
    $testSuccess = Test-Installation -InstallPath $TestInstallPath
    if (-not $testSuccess) {
        Write-Host "Installation test failed" -ForegroundColor Red
        exit 1
    }
    
    # Cleanup test installation
    Write-Host "Cleaning up test installation..." -ForegroundColor Yellow
    if (Test-Path $TestInstallPath) {
        Remove-Item -Path $TestInstallPath -Recurse -Force
    }
}

Write-Host ""
Write-Host "Test completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. The installer is ready: installer_output\CacheDB_Setup_1.0.0.exe" -ForegroundColor White
Write-Host "2. Test the installer on a clean system" -ForegroundColor White
Write-Host "3. Distribute the installer to users" -ForegroundColor White 