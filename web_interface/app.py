from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
import socket
import sys

app = Flask(__name__)
app.secret_key = 'super_secret_key' # Replace with a strong, random key in production

# Server configuration (should match config.json of your C++ server)
SERVER_HOST = '127.0.0.1'
SERVER_PORT = 6379

def send_command_to_db_server(command, password):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.connect((SERVER_HOST, SERVER_PORT))
            
            # Authenticate first
            auth_command = f"AUTH {password}\n"
            sock.sendall(auth_command.encode())
            auth_response = sock.recv(1024).decode().strip()

            if auth_response != "+OK":
                return f"-ERR Authentication failed: {auth_response}"

            # Send the actual command
            full_command = f"{command}\n"
            sock.sendall(full_command.encode())
            
            # Receive response
            response = sock.recv(4096).decode().strip()
            return response
    except ConnectionRefusedError:
        return "-ERR Connection to DB server refused. Is mydb_server.exe running?"
    except Exception as e:
        return f"-ERR An error occurred: {e}"

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        password = request.form['password']
        # Attempt to authenticate with the server
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.connect((SERVER_HOST, SERVER_PORT))
                auth_command = f"AUTH {password}\n"
                sock.sendall(auth_command.encode())
                auth_response = sock.recv(1024).decode().strip()

                if auth_response == "+OK":
                    session['logged_in'] = True
                    session['db_password'] = password
                    flash('Logged in successfully!', 'success')
                    return redirect(url_for('index'))
                else:
                    flash(f'Authentication failed: {auth_response}', 'error')
        except ConnectionRefusedError:
            flash("-ERR Connection to DB server refused. Is mydb_server.exe running?", 'error')
        except Exception as e:
            flash(f"-ERR An error occurred during login: {e}", 'error')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    session.pop('db_password', None)
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))

@app.route('/')
def index():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/command', methods=['POST'])
def handle_command():
    if not session.get('logged_in'):
        return jsonify({"status": "error", "message": "Not authenticated."}), 401

    data = request.json
    cmd = data.get('command')
    key = data.get('key', '')
    value = data.get('value', '')

    full_cmd = ""
    if cmd == "SET":
        full_cmd = f'SET {key} "{value}"'
    elif cmd == "GET":
        full_cmd = f"GET {key}"
    elif cmd == "DEL":
        full_cmd = f"DEL {key}"
    elif cmd == "EXPIRE":
        full_cmd = f"EXPIRE {key} {value}" # value here is seconds
    elif cmd == "LPUSH":
        full_cmd = f'LPUSH {key} "{value}"'
    elif cmd == "RPUSH":
        full_cmd = f'RPUSH {key} "{value}"'
    elif cmd == "LPOP":
        full_cmd = f"LPOP {key}"
    elif cmd == "RPOP":
        full_cmd = f"RPOP {key}"
    elif cmd == "LLEN":
        full_cmd = f"LLEN {key}"
    elif cmd == "SAVE":
        full_cmd = "SAVE"
    elif cmd == "LOAD":
        full_cmd = "LOAD"
    elif cmd == "AI_SUGGEST":
        full_cmd = "AI_SUGGEST"
    elif cmd == "HLL.ADD":
        full_cmd = f'HLL.ADD {key} "{value}"'
    elif cmd == "HLL.COUNT":
        full_cmd = f"HLL.COUNT {key}"
    elif cmd == "SUBSCRIBE":
        full_cmd = f"SUBSCRIBE {key}" # key is channel
    elif cmd == "PUBLISH":
        full_cmd = f'PUBLISH {key} "{value}"' # key is channel, value is message
    else:
        return jsonify({"status": "error", "message": "Unknown command"}), 400

    password = session.get('db_password')
    if not password:
        return jsonify({"status": "error", "message": "No password found in session. Please log in again."}), 401
    
    response = send_command_to_db_server(full_cmd, password)
    
    # Process the response to make it user-friendly
    if response.startswith('+OK') or response.startswith('"') or response.startswith('(nil)') or response.startswith('This'):
        return jsonify({"status": "success", "response": response})
    elif response.startswith('-ERR'):
        return jsonify({"status": "error", "message": response}), 500
    else:
        return jsonify({"status": "success", "response": response}) # Fallback for unexpected but non-error responses

if __name__ == '__main__':
    app.run(debug=True, port=5000) 