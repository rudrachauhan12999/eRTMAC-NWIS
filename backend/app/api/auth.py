import uuid

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.repositories import users_repo
from app.dependencies import get_current_user, get_db
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, UserProfile
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(tags=["auth"])


def _derive_role_group(role: str) -> str:
    """Best-effort mapping from a free-text role title to the internal
    roleGroup enum, mirroring the clearance-level heuristic the frontend's
    AuthModal already used client-side (Director/Lead -> higher clearance)
    so self-registered accounts behave the same as before this was wired
    to a real backend. Self-registration never grants ADMIN.
    """
    lowered = role.lower()
    if "geolog" in lowered:
        return "GEOLOGIST"
    if any(term in lowered for term in ("director", "lead", "superintendent", "supervisor")):
        return "SUPERVISOR"
    return "DRILLING_ENGINEER"


@router.post("/auth/login", response_model=LoginResponse)
async def login(payload: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await users_repo.get_user_by_email(db, payload.email)
    if user is None or not verify_password(payload.password, user["passwordHash"]):
        raise HTTPException(401, detail="Invalid email or password")

    public_user = {k: v for k, v in user.items() if k != "passwordHash"}
    token = create_access_token(subject=user["id"], extra_claims={"roleGroup": user["roleGroup"]})
    return {"token": token, "user": public_user}


@router.post("/auth/register", response_model=LoginResponse)
async def register(payload: RegisterRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    existing = await users_repo.get_user_by_email(db, payload.email)
    if existing is not None:
        raise HTTPException(409, detail="An account with this email already exists")

    role_group = _derive_role_group(payload.role)
    user = {
        "id": f"user-{uuid.uuid4().hex[:12]}",
        "name": payload.name,
        "email": payload.email,
        "role": payload.role,
        "department": payload.department,
        "badgeNumber": f"OIL-REG-{uuid.uuid4().int % 9000 + 1000}",
        "clearanceLevel": "Level 4 - Executive Command" if role_group == "SUPERVISOR" else "Level 2 - Authorized Field Access",
        "isCustomAccount": True,
        "roleGroup": role_group,
        "passwordHash": hash_password(payload.password),
    }
    await users_repo.create_user(db, user)

    public_user = {k: v for k, v in user.items() if k != "passwordHash"}
    token = create_access_token(subject=user["id"], extra_claims={"roleGroup": role_group})
    return {"token": token, "user": public_user}


@router.get("/auth/me", response_model=UserProfile)
async def me(claims: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await db["users"].find_one({"id": claims["sub"]})
    if user is None:
        raise HTTPException(404, detail="User not found")
    user.pop("_id", None)
    return {k: v for k, v in user.items() if k != "passwordHash"}


@router.post("/auth/logout", status_code=204)
async def logout(claims: dict = Depends(get_current_user)):
    # Stateless JWT: the client discards the token. No server-side session to invalidate
    # yet (no denylist store) — documented limitation, not silently pretended away.
    return None
