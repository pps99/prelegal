import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        user = User(email=request.email)
        db.add(user)
        db.commit()
        db.refresh(user)
    return {"token": str(uuid.uuid4()), "user": {"email": user.email}}
