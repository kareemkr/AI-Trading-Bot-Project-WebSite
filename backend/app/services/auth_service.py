class AuthService:
    def validate_user(self, username, password):
        return username == "demo" and password == "demo"
