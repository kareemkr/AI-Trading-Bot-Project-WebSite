from fastapi import APIRouter

router = APIRouter()

@router.post("/login")
def login():
    return {"status": "ok", "message": "Logged in (demo mode)"}
