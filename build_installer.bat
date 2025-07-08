@echo off
echo Building CacheDB Installer...
echo.

REM Check if Inno Setup is installed
where iscc >nul 2>&1
if ERRORLEVEL 1 (
    echo Error: Inno Setup Compiler (iscc) not found in PATH
    echo Please install Inno Setup from: https://jrsoftware.org/isinfo.php
    echo After installation, make sure iscc.exe is in your PATH
    pause
    exit /b 1
)

REM Create installer output directory
if not exist "installer_output" mkdir installer_output

REM Build the installer
echo Compiling installer...
iscc installer.iss
if ERRORLEVEL 1 (
    echo.
    echo Error: Failed to build installer
    echo Please check the error messages above.
) else (
    echo.
    echo Installer built successfully!
    echo Output: installer_output\CacheDB_Setup_1.0.0.exe
    echo.
    echo You can now distribute this installer to users.
)

pause 