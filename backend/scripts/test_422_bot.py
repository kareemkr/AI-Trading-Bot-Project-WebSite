import requests

url = "http://localhost:8000/bot/start"
# We don't have a valid token, so we'll just see if it hits 422 first
payload = {"invalid_field": "test"}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
