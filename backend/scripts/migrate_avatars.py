import os
import sys
import base64
import uuid
import asyncio
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

# Add app to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import AsyncSessionLocal
from app.models.user import User

UPLOAD_DIR = "uploads/avatars"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def migrate_avatars():
    print("Starting avatar migration...")
    async with AsyncSessionLocal() as db:
        # Find users with base64 avatars
        result = await db.execute(select(User).where(User.avatar.like("data:image/%")))
        users_to_migrate = result.scalars().all()
        
        print(f"Found {len(users_to_migrate)} users with base64 avatars.")
        
        migrated_count = 0
        error_count = 0
        
        for user in users_to_migrate:
            try:
                # Extract base64 data
                header, base64_data = user.avatar.split(",", 1)
                extension = header.split(";")[0].split("/")[-1]
                if extension == "jpeg": extension = "jpg"
                
                # Create unique file name
                file_name = f"{uuid.uuid4()}.{extension}"
                file_path = os.path.join(UPLOAD_DIR, file_name)
                
                # Decode and save
                image_data = base64.b64decode(base64_data)
                with open(file_path, "wb") as f:
                    f.write(image_data)
                
                # Update database path
                new_path = f"/{UPLOAD_DIR}/{file_name}".replace("\\", "/")
                user.avatar = new_path
                migrated_count += 1
                print(f"Migrated user {user.email}: {new_path}")
                
            except Exception as e:
                print(f"Error migrating user {user.email}: {e}")
                error_count += 1
        
        if migrated_count > 0:
            await db.commit()
            print(f"Migration complete. Successfully migrated {migrated_count} users. Errors: {error_count}")
        else:
            print("No migrations performed.")

if __name__ == "__main__":
    asyncio.run(migrate_avatars())
