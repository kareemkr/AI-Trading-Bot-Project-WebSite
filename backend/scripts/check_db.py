import asyncio
from sqlalchemy import select
from app.database.session import engine, async_session
from app.models.user import User

async def check_db():
    print("Connecting to database...")
    try:
        async with engine.connect() as conn:
            print("Successfully connected to the database engine.")
            
        async with async_session() as session:
            print("Session created. Querying users...")
            result = await session.execute(select(User))
            users = result.scalars().all()
            print(f"Found {len(users)} users.")
            for u in users:
                print(f"- {u.email} (Status: {u.subscription_status})")
                
    except Exception as e:
        print(f"DATABASE ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_db())
