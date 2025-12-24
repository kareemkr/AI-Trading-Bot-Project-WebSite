import requests

url = "http://localhost:8000/bot/start"
headers = {"Authorization": "Bearer INVALID_TOKEN"}
payload = {"leverage": 10, "use_news_ai": True}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
