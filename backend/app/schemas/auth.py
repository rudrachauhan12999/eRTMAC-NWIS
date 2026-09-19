from typing import Literal

from pydantic import BaseModel

RoleGroup = Literal["DRILLING_ENGINEER", "GEOLOGIST", "SUPERVISOR", "ADMIN"]


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str
    department: str


class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department: str
    badgeNumber: str
    clearanceLevel: str
    avatar: str | None = None
    isCustomAccount: bool | None = None
    roleGroup: RoleGroup


class LoginResponse(BaseModel):
    token: str
    user: UserProfile
