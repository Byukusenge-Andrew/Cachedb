; Inno Setup script for CacheDB installer
#define MyAppName "CacheDB"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Byukusenge_Andrew"
#define MyAppURL "https://github.com/Byukusenge_Andrew/CacheDB"
#define MyAppExeName "mydb_server.exe"
#define MyAppClientExeName "mydb.exe"

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
Name: "startweb"; Description: "Start Web Interface after installation"; GroupDescription: "Post-installation options"; Flags: unchecked
Name: "installservice"; Description: "Install as Windows Service"; GroupDescription: "Service options"; Flags: unchecked

[Files]
; Main executables
Source: "build\mydb_server.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "build\mydb.exe"; DestDir: "{app}"; Flags: ignoreversion

; Configuration files
Source: "config.json"; DestDir: "{app}"; Flags: ignoreversion; Permissions: users-full
Source: "db.json"; DestDir: "{app}"; Flags: ignoreversion; Permissions: users-full

; Web interface
Source: "web_interface\app.py"; DestDir: "{app}\web_interface"; Flags: ignoreversion
Source: "web_interface\requirements.txt"; DestDir: "{app}\web_interface"; Flags: ignoreversion
Source: "web_interface\templates\*"; DestDir: "{app}\web_interface\templates"; Flags: ignoreversion recursesubdirs

; Documentation
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion

; PowerShell connection script
Source: "connect_db.ps1"; DestDir: "{app}"; Flags: ignoreversion

; Libraries (if any DLLs are present)
; Source: "build\*.dll"; DestDir: "{app}"; Flags: ignoreversion

; Create data directory
Source: "db.aof"; DestDir: "{app}\data"; Flags: ignoreversion; Permissions: users-full

[Icons]
Name: "{group}\{#MyAppName} Server"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{group}\{#MyAppName} Client"; Filename: "{app}\{#MyAppClientExeName}"; WorkingDir: "{app}"
Name: "{group}\Web Interface"; Filename: "http://localhost:5000"; IconFilename: "{app}\web_interface\static\favicon.ico"
Name: "{group}\Connect to Database"; Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\connect_db.ps1"""; WorkingDir: "{app}"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName} Server"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon; WorkingDir: "{app}"
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: quicklaunchicon; WorkingDir: "{app}"

[Registry]
; Register the application
Root: HKLM; Subkey: "SOFTWARE\{#MyAppName}"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"; Flags: uninsdeletekey
Root: HKLM; Subkey: "SOFTWARE\{#MyAppName}"; ValueType: string; ValueName: "Version"; ValueData: "{#MyAppVersion}"; Flags: uninsdeletekey

; Add to PATH
Root: HKLM; Subkey: "SYSTEM\CurrentControlSet\Control\Session Manager\Environment"; ValueType: expandsz; ValueName: "Path"; ValueData: "{olddata};{app}"; Check: NeedsAddPath(ExpandConstant('{app}'))

[Run]
; Install Python dependencies for web interface
Filename: "python.exe"; Parameters: "-m pip install -r ""{app}\web_interface\requirements.txt"""; WorkingDir: "{app}\web_interface"; StatusMsg: "Installing Python dependencies..."; Flags: runhidden

; Start the server if requested
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent; Tasks: startserver

; Start web interface if requested
Filename: "python.exe"; Parameters: "app.py"; WorkingDir: "{app}\web_interface"; Description: "Start Web Interface"; Flags: nowait postinstall skipifsilent; Tasks: startweb

[UninstallDelete]
Type: filesandordirs; Name: "{app}\data"
Type: filesandordirs; Name: "{app}\logs"

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