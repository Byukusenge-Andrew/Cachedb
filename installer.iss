; Inno Setup script for CacheDB installer
#define MyAppName "CacheDB"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Byukusenge-Andrew"
#define MyAppURL "https://github.com/Byukusenge-Andrew/Cachedb"
#define MyAppExeName "mydb_server.exe"
#define MyAppClientExeName "mydb.exe"
#define MyAppDesktopExeName "CacheDB-Desktop.exe"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=LICENSE
OutputDir=installer_output
OutputBaseFileName=CacheDB_Setup_{#MyAppVersion}
SetupIconFile=icon.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode
Name: "startserver"; Description: "Start CacheDB Server after installation"; GroupDescription: "Post-installation options"; Flags: unchecked
Name: "startdesktop"; Description: "Launch Desktop Application after installation"; GroupDescription: "Post-installation options"; Flags: checked
Name: "startweb"; Description: "Start Web Interface after installation"; GroupDescription: "Post-installation options"; Flags: unchecked
Name: "installservice"; Description: "Install as Windows Service"; GroupDescription: "Service options"; Flags: unchecked
Name: "addtopath"; Description: "Add CacheDB to system PATH"; GroupDescription: "System integration"; Flags: checked

[Files]
; Main executables
Source: "build\mydb_server.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "build\mydb.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "start_web_interface.bat"; DestDir: "{app}"; Flags: ignoreversion

; Desktop Application
Source: "desktop-app\dist\CacheDB-Desktop.exe"; DestDir: "{app}\desktop"; Flags: ignoreversion; Check: FileExists(ExpandConstant('{srcexe}\..\desktop-app\dist\CacheDB-Desktop.exe'))
Source: "desktop-app\dist\*"; DestDir: "{app}\desktop"; Flags: ignoreversion recursesubdirs; Check: DirExists(ExpandConstant('{srcexe}\..\desktop-app\dist'))

; Configuration files
Source: "config.json"; DestDir: "{app}"; Flags: ignoreversion; Permissions: users-full
Source: "db.json"; DestDir: "{app}"; Flags: ignoreversion; Permissions: users-full

; Web interface
Source: "web_interface\app.py"; DestDir: "{app}\web_interface"; Flags: ignoreversion
Source: "web_interface\requirements.txt"; DestDir: "{app}\web_interface"; Flags: ignoreversion
Source: "web_interface\templates\*"; DestDir: "{app}\web_interface\templates"; Flags: ignoreversion recursesubdirs

; Documentation
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "LICENSE"; DestDir: "{app}"; Flags: ignoreversion
Source: "INSTALLATION_GUIDE.md"; DestDir: "{app}"; Flags: ignoreversion

; PowerShell connection script
Source: "connect_db.ps1"; DestDir: "{app}"; Flags: ignoreversion

; Post installation setup script
Source: "post_install_setup.ps1"; DestDir: "{app}"; Flags: ignoreversion

; Create data directory with sample data
Source: "db.aof"; DestDir: "{app}\data"; Flags: ignoreversion; Permissions: users-full; Check: FileExists(ExpandConstant('{srcexe}\..\db.aof'))

[Icons]
Name: "{group}\{#MyAppName} Desktop"; Filename: "{app}\desktop\{#MyAppDesktopExeName}"; WorkingDir: "{app}\desktop"; IconFilename: "{app}\desktop\resources\app.ico"; Check: FileExists(ExpandConstant('{app}\desktop\{#MyAppDesktopExeName}'))
Name: "{group}\{#MyAppName} Server"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{group}\{#MyAppName} Client"; Filename: "{app}\{#MyAppClientExeName}"; WorkingDir: "{app}"
Name: "{group}\Web Interface"; Filename: "http://localhost:5000"; IconFilename: "{app}\icon.ico"
Name: "{group}\Connect to Database"; Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\connect_db.ps1"""; WorkingDir: "{app}"
Name: "{group}\Documentation"; Filename: "{app}\README.md"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\desktop\{#MyAppDesktopExeName}"; Tasks: desktopicon; WorkingDir: "{app}\desktop"; IconFilename: "{app}\desktop\resources\app.ico"; Check: FileExists(ExpandConstant('{app}\desktop\{#MyAppDesktopExeName}'))
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\desktop\{#MyAppDesktopExeName}"; Tasks: quicklaunchicon; WorkingDir: "{app}\desktop"
[Registry]
; Register the application
Root: HKLM; Subkey: "SOFTWARE\{#MyAppName}"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"; Flags: uninsdeletekey
Root: HKLM; Subkey: "SOFTWARE\{#MyAppName}"; ValueType: string; ValueName: "Version"; ValueData: "{#MyAppVersion}"; Flags: uninsdeletekey
Root: HKLM; Subkey: "SOFTWARE\{#MyAppName}"; ValueType: string; ValueName: "DesktopPath"; ValueData: "{app}\desktop"; Flags: uninsdeletekey

; Add to PATH (conditional)
Root: HKLM; Subkey: "SYSTEM\CurrentControlSet\Control\Session Manager\Environment"; ValueType: expandsz; ValueName: "Path"; ValueData: "{olddata};{app}"; Check: NeedsAddPath(ExpandConstant('{app}')) and IsTaskSelected('addtopath')

; Register file associations for .cachedb files
Root: HKCR; Subkey: ".cachedb"; ValueType: string; ValueName: ""; ValueData: "CacheDBFile"; Flags: uninsdeletevalue
Root: HKCR; Subkey: "CacheDBFile"; ValueType: string; ValueName: ""; ValueData: "CacheDB Database File"; Flags: uninsdeletekey
Root: HKCR; Subkey: "CacheDBFile\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\icon.ico"
Root: HKCR; Subkey: "CacheDBFile\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\desktop\{#MyAppDesktopExeName}"" ""%1"""; Check: FileExists(ExpandConstant('{app}\desktop\{#MyAppDesktopExeName}'))

[Run]
; Run post-installation setup script
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\post_install_setup.ps1"""; StatusMsg: "Running post-installation setup..."; Flags: runhidden; Check: FileExists(ExpandConstant('{app}\post_install_setup.ps1'))

; Install Python dependencies for web interface (try multiple Python paths)
Filename: "python"; Parameters: "-m pip install -r ""{app}\web_interface\requirements.txt"""; WorkingDir: "{app}\web_interface"; StatusMsg: "Installing Python dependencies..."; Flags: runhidden; Check: PythonInstalled

; Start the desktop application if requested
Filename: "{app}\desktop\{#MyAppDesktopExeName}"; Description: "Launch {#MyAppName} Desktop Application"; Flags: nowait postinstall skipifsilent; Tasks: startdesktop; Check: FileExists(ExpandConstant('{app}\desktop\{#MyAppDesktopExeName}'))

; Start the server if requested
Filename: "{app}\{#MyAppExeName}"; Description: "Start {#MyAppName} Server"; Flags: nowait postinstall skipifsilent; Tasks: startserver

; Start web interface if requested
Filename: "python"; Parameters: "app.py"; WorkingDir: "{app}\web_interface"; Description: "Start Web Interface"; Flags: nowait postinstall skipifsilent; Tasks: startweb; Check: PythonInstalled

; Show installation complete message
Filename: "{app}\README.md"; Description: "View Documentation"; Flags: postinstall skipifsilent shellexec

[UninstallDelete]
Type: filesandordirs; Name: "{app}\data"
Type: filesandordirs; Name: "{app}\logs"
Type: filesandordirs; Name: "{app}\desktop\resources\app.asar.unpacked"
Type: files; Name: "{app}\desktop\*.log"

[Code]
function NeedsAddPath(Param: string): boolean;
var
  OrigPath: string;
begin
  if not RegQueryStringValue(HKEY_LOCAL_MACHINE,
    'SYSTEM\CurrentControlSet\Control\Session Manager\Environment',
    'Path', OrigPath)
  then begin
    Result := True;
    exit;
  end;
  Result := Pos(';' + Param + ';', ';' + OrigPath + ';') = 0;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Create data directory
    if not DirExists(ExpandConstant('{app}\data')) then
      CreateDir(ExpandConstant('{app}\data'));
    
    // Create logs directory
    if not DirExists(ExpandConstant('{app}\logs')) then
      CreateDir(ExpandConstant('{app}\logs'));
  end;
end;

[CustomMessages]
english.InstallingPythonDeps=Installing Python dependencies for web interface...
english.StartingServer=Starting CacheDB Server...
english.StartingWebInterface=Starting Web Interface...