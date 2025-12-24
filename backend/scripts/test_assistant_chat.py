import requests

url = "http://localhost:8000/assistant/chat"
payload = {"message": "Hello, how are you?", "mode": "trading"}
try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
