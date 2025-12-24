import os
from dotenv import load_dotenv
from sqlalchemy.engine.url import make_url

load_dotenv()
url_str = os.getenv("DATABASE_URL")
print(f"URL String from env: {url_str}")

if url_str:
    url = make_url(url_str)
    print(f"Parsed Username: {url.username}")
    print(f"Parsed Password: {url.password}")
    print(f"Parsed Host/Port: {url.host}:{url.port}")
    print(f"Parsed DB: {url.database}")
else:
    print("No DATABASE_URL found in env.")
