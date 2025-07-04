$port = 6379
$server = "localhost"
$password = "your_strong_password_here" # Make sure this matches your config.json

$client = New-Object System.Net.Sockets.TcpClient($server, $port)
$stream = $client.GetStream()
$writer = New-Object System.IO.StreamWriter($stream)
$reader = New-Object System.IO.StreamReader($stream)

# Authenticate
$authCommand = "AUTH " + $password
$writer.WriteLine($authCommand)
$writer.Flush()
$response = $reader.ReadLine()
Write-Host "Server response (AUTH): $response"

if ($response -eq "+OK") {
    Write-Host "Authentication successful. You can now send commands like SET, GET, DEL, SAVE, LOAD, EXPIRE, QUIT."
    Write-Host "Type 'exit' to quit the client."
    while ($true) {
        $command = Read-Host "> "
        if ($command -eq "exit") {
            $writer.WriteLine("QUIT")
            $writer.Flush()
            break
        }
        $writer.WriteLine($command)
        $writer.Flush()
        $serverResponse = $reader.ReadLine()
        Write-Host "Server response: $serverResponse"
    }
} else {
    Write-Host "Authentication failed. Exiting."
}

$writer.Close()
$reader.Close()
$stream.Close()
$client.Close() 