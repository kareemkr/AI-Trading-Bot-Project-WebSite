try:
    from app.main import app
    print("Main app imported successfully.")
    
    from app.api.auth import get_current_user
    print("Auth dependencies imported successfully.")
    
    from app.routes.bot import router as bot_router
    print("Bot router imported successfully.")
    
    from app.ml.engine import RealTradingBot
    print("Trading engine imported successfully.")
    
except Exception as e:
    print(f"IMPORT ERROR: {e}")
    import traceback
    traceback.print_exc()
