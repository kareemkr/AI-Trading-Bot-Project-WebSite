from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from datetime import datetime, timedelta
import jwt
import os

router = APIRouter(prefix="/oauth", tags=["OAuth"])

SECRET_KEY = "SUPER_SECRET_KEY"
ALGORITHM = "HS256"

# ALLOW HTTP FOR LOCALHOST
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

def create_token(email: str, name: str):
    payload = {
        "sub": email,
        "name": name,
        "exp": datetime.utcnow() + timedelta(hours=24),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

oauth = OAuth()

# ---------- GOOGLE ----------
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

# ---------- GITHUB ----------
oauth.register(
    name="github",
    client_id=os.getenv("GITHUB_CLIENT_ID"),
    client_secret=os.getenv("GITHUB_CLIENT_SECRET"),
    authorize_url="https://github.com/login/oauth/authorize",
    access_token_url="https://github.com/login/oauth/access_token",
    client_kwargs={"scope": "user:email"},
)

@router.get("/login/{provider}")
async def oauth_login(request: Request, provider: str):
    redirect_uri = request.url_for("oauth_callback", provider=provider)
    
    extra_params = {}
    if provider == "google":
        extra_params["prompt"] = "select_account"

    return await oauth.create_client(provider).authorize_redirect(
        request, redirect_uri, **extra_params
    )

@router.get("/callback/{provider}", name="oauth_callback")
async def oauth_callback(request: Request, provider: str):
    try:
        client = oauth.create_client(provider)
        token = await client.authorize_access_token(request)

        if provider == "google":
            # user = await client.parse_id_token(request, token)
            # Fallback to userinfo endpoint to avoid id_token errors
            resp = await client.get('https://www.googleapis.com/oauth2/v3/userinfo', token=token)
            user = resp.json()
            email = user["email"]
            name = user.get("name", "User")

        elif provider == "github":
            resp = await client.get("https://api.github.com/user", token=token)
            profile = resp.json()
            email = profile.get("email", "github@user.com")
            name = profile.get("name") or profile.get("login")

        jwt_token = create_token(email, name)

        return RedirectResponse(
            f"http://localhost:3000/oauth-success?token={jwt_token}"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e), "trace": traceback.format_exc()}
