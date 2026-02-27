import socketio
import requests
import sys
import time

# Configuration
API_URL = "http://localhost:8000/api/v1"
SOCKET_URL = "http://localhost:8000"
USERNAME = "employee1"
PASSWORD = "Employee@123"

# 1. Login to get token
print(f"Logging in as {USERNAME}...")
try:
    response = requests.post(f"{API_URL}/auth/login", json={"username": USERNAME, "password": PASSWORD})
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        sys.exit(1)
    
    token = response.json()["access_token"]
    user_id = response.json()["user"]["id"]
    print(f"Login success! Token obtained. User ID: {user_id}")
except Exception as e:
    print(f"Connection failed: {e}")
    sys.exit(1)

# 2. Connect to Socket.IO
sio = socketio.Client()

@sio.event
def connect():
    print("Socket connected!")

@sio.event
def connect_error(data):
    print(f"Socket connection failed: {data}")

@sio.event
def disconnect():
    print("Socket disconnected!")

@sio.on('task_created')
def on_task_created(data):
    print(f"\n[EVENT] task_created received: {data}")

@sio.on('notification_created')
def on_notification_created(data):
    print(f"\n[EVENT] notification_created received: {data}")

@sio.on('user_online')
def on_user_online(data):
    print(f"[EVENT] user_online: {data}")

try:
    print(f"Connecting to socket at {SOCKET_URL}...")
    sio.connect(SOCKET_URL, auth={"token": token}, wait_timeout=10)
    print("Listening for events... Press Ctrl+C to exit.")
    sio.wait()
except Exception as e:
    print(f"Socket error: {e}")
    sio.disconnect()
