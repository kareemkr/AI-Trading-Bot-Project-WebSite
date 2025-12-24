import requests

# 1. Sign in to get a real token
login_url = "http://localhost:8000/auth/login"
# Use the credentials from previous context or common dev ones
# If this fails, we know login is broken
creds = {"email": "test@example.com", "password": "password"} 

print(f"Attempting login for {creds['email']}...")
try:
    login_res = requests.post(login_url, json=creds)
    print(f"Login Status: {login_res.status_code}")
    if login_res.status_code == 200:
        data = login_res.json()
        token = data.get("access_token")
        print("Login Successful!")
        
        # 2. Try to start the bot
        start_url = "http://localhost:8000/bot/start"
        headers = {"Authorization": f"Bearer {token}"}
        payload = {"leverage": 10, "use_news_ai": True}
        
        print("Attempting to start bot...")
        start_res = requests.post(start_url, json=payload, headers=headers)
        print(f"Start Status: {start_res.status_code}")
        print(f"Start Response: {start_res.json()}")
    else:
        print(f"Login Failed: {login_res.text}")
except Exception as e:
    print(f"Error: {e}")
