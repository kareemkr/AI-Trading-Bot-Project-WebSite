import requests

# We need a token to test /bot/start since it has get_current_user dependency
# For testing purposes, we can try to hit /bot/status or other non-auth routes first
# But the user is reporting failure on START (which is auth-protected)

print("Checking bot status...")
try:
    res = requests.get("http://localhost:8000/bot/status")
    print(f"Status: {res.status_code}, Response: {res.json()}")
except Exception as e:
    print(f"Error: {e}")
