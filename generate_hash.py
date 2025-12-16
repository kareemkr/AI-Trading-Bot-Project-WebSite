import bcrypt
pw = b"kareem"
hashed = bcrypt.hashpw(pw, bcrypt.gensalt())
print(f"Hash: {hashed.decode()}")
print(f"Length: {len(hashed)}")
with open("hash.txt", "w") as f:
    f.write(hashed.decode())
