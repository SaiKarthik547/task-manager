from typing import Optional, List
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict # or a User schema

class TokenData(BaseModel):
    userId: int
    username: str
    permissions: List[str] = []

class LoginRequest(BaseModel):
    username: str
    password: str
