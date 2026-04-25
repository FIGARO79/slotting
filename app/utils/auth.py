from fastapi import Depends, HTTPException

def login_required(user: str = "fabio"):
    return user

def permission_required(permission: str):
    def decorator(user: str = Depends(login_required)):
        return user
    return decorator
