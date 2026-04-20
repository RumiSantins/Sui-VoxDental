import requests

url = "http://127.0.0.1:8000/api/v1/feedback"
data = {
    "name": "Test Antigravity",
    "email": "test@example.com",
    "comment": "Prueba final de funcionamiento del backend local"
}

try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
