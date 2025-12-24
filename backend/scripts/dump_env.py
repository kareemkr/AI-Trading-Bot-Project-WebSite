import os
from dotenv import load_dotenv

load_dotenv()
print(f"DATABASE_URL: {os.getenv('DATABASE_URL')}")
print(f"JWT_SECRET: {os.getenv('JWT_SECRET')}")
