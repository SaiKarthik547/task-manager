import requests
import sys

API_URL = "http://localhost:8000/api/v1"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Admin@123"

# 1. Login as Admin
print(f"Logging in as {ADMIN_USERNAME}...")
try:
    response = requests.post(f"{API_URL}/auth/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        sys.exit(1)
    
    token = response.json()["access_token"]
    admin_id = response.json()["user"]["id"]
    print(f"Admin Login success! Token obtained.")
except Exception as e:
    print(f"Connection failed: {e}")
    sys.exit(1)

# 2. Use hardcoded employee ID (employee1 is ID 3 from seed)
employee_id = 3
print(f"Using employee1 with ID: {employee_id}")

# 3. Create Task
task_data = {
    "title": "Real-time Socket Test Task",
    "description": "This task should appear instantly on the employee's screen.",
    "assigned_to": employee_id,
    "priority": "high",
    "status": "in_progress"
}

headers = {"Authorization": f"Bearer {token}"}
print("Creating task...")
create_res = requests.post(f"{API_URL}/tasks/", json=task_data, headers=headers)

if create_res.status_code == 200:
    print("✅ Task created successfully!")
    task = create_res.json()["task"]
    print(f"   Task ID: {task['id']}")
    print(f"   Title: {task['title']}")
    print(f"   Assigned to: {task['assigned_to']}")
    print("\n🔔 Check verify_socket.py output for real-time events:")
    print("   - task_created event")
    print("   - notification_created event")
else:
    print(f"❌ Failed to create task: {create_res.status_code}")
    print(f"   Response: {create_res.text}")

