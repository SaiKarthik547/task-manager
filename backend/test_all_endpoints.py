import requests

API_URL = "http://localhost:8000/api/v1"

print("Logging in as admin...")
login_response = requests.post(
    f"{API_URL}/auth/login",
    json={"username": "admin", "password": "Admin@123"}
)
if login_response.status_code != 200:
    print("Login failed:", login_response.text)
    exit(1)

token = login_response.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

endpoints = [
    "/users/",
    "/roles/",
    "/roles/permissions",
    "/projects/",
    "/tasks/",
    "/messages/conversations"
]

for endpoint in endpoints:
    print(f"\\nTesting GET {endpoint}...")
    res = requests.get(f"{API_URL}{endpoint}", headers=headers)
    print(f"Status: {res.status_code}")
    if res.status_code != 200:
        print(f"Response error: {res.text[:500]}")
    else:
        print("Success, length of response:", len(res.text))
