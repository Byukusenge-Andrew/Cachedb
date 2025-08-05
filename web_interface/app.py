from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
import socket
import sys
import json

app = Flask(__name__)
app.secret_key = 'super_secret_key' 

SERVER_HOST = '127.0.0.1'
SERVER_PORT = 6379

def send_command(command, password):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.connect((SERVER_HOST, SERVER_PORT))
            
            auth_command = f"AUTH {password}\n"
            sock.sendall(auth_command.encode())
            auth_response = sock.recv(1024).decode().strip()

            if auth_response != "+OK":
                return f"Error: Authentication failed: {auth_response}"

            sock.sendall(f"{command}\n".encode())
            
            # Simple RESP-like parser
            response_type = sock.recv(1).decode()
            if response_type == '+': # Simple String
                return sock.recv(4096).decode().strip()
            if response_type == '-': # Error
                return f"Error: {sock.recv(4096).decode().strip()}"
            if response_type == '$': # Bulk String
                length = int(sock.recv(4096).decode().split('\r\n')[0])
                if length == -1: return None
                return sock.recv(length + 2).decode().strip()
            if response_type == '*': # Array
                count = int(sock.recv(4096).decode().split('\r\n')[0])
                elements = []
                for _ in range(count):
                    # For simplicity, assuming array of bulk strings
                    sock.recv(1) # $
                    length = int(sock.recv(4096).decode().split('\r\n')[0])
                    elements.append(sock.recv(length + 2).decode().strip())
                return elements
            return "Error: Unknown response type"

    except ConnectionRefusedError:
        return "Error: Connection to DB server refused."
    except Exception as e:
        return f"Error: An error occurred: {e}"

@app.route('/', methods=['GET', 'POST'])
def index():
    if 'password' not in session:
        return redirect(url_for('login'))

    projects = send_command("LIST_PROJECTS", session['password'])
    if isinstance(projects, str) and projects.startswith("Error:"):
        flash(projects)
        projects = []
    
    return render_template('index.html', projects=projects)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        password = request.form['password']
        # Test auth
        response = send_command("LIST_PROJECTS", password) 
        if isinstance(response, str) and response.startswith("Error:"):
            flash('Login Failed. ' + response)
            return redirect(url_for('login'))
        session['password'] = password
        return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('password', None)
    return redirect(url_for('login'))

@app.route('/project/<project_name>')
def view_project(project_name):
    if 'password' not in session:
        return redirect(url_for('login'))
    
    databases = send_command(f"LIST_DATABASES IN {project_name}", session['password'])
    if isinstance(databases, str) and databases.startswith("Error:"):
        flash(databases)
        databases = []

    return render_template('project.html', project_name=project_name, databases=databases)

@app.route('/project/<project_name>/<db_name>')
def view_database(project_name, db_name):
    if 'password' not in session:
        return redirect(url_for('login'))

    send_command(f"USE {project_name} {db_name}", session['password'])
    data_str = send_command("GET_ALL", session['password'])
    
    data = {}
    if data_str and not data_str.startswith("Error:"):
        try:
            data = json.loads(data_str)
        except json.JSONDecodeError:
            flash("Error: Could not decode database data.")

    return render_template('database.html', project_name=project_name, db_name=db_name, data=data)

@app.route('/create_project', methods=['POST'])
def create_project():
    if 'password' not in session: return redirect(url_for('login'))
    project_name = request.form['project_name']
    response = send_command(f"CREATE_PROJECT {project_name}", session['password'])
    if "Error" in response: flash(response)
    return redirect(url_for('index'))

@app.route('/create_database/<project_name>', methods=['POST'])
def create_database(project_name):
    if 'password' not in session: return redirect(url_for('login'))
    db_name = request.form['db_name']
    response = send_command(f"CREATE_DATABASE {db_name} IN {project_name}", session['password'])
    if "Error" in response: flash(response)
    return redirect(url_for('view_project', project_name=project_name))

@app.route('/set/<project_name>/<db_name>', methods=['POST'])
def set_key(project_name, db_name):
    if 'password' not in session: return redirect(url_for('login'))
    key = request.form['key']
    value = request.form['value']
    send_command(f"USE {project_name} {db_name}", session['password'])
    send_command(f"SET {key} {value}", session['password'])
    return redirect(url_for('view_database', project_name=project_name, db_name=db_name))

if __name__ == '__main__':
    app.run(debug=True, port=5000) 