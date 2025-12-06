import redis
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

def set_cache(key: str, value, ttl: int = 3600):
    redis_client.set(key, value, ex=ttl)

def get_cache(key: str):
    return redis_client.get(key)

def delete_cache(key: str):
    redis_client.delete(key)
