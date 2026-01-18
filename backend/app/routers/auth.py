from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas, utils

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.AuthResponse)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.name == user_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Имя уже занято")

    hashed = utils.hash_password(user_in.password)
    user = models.User(name=user_in.name, password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)

    token = utils.generate_token()
    return {"user": {"id": str(user.id), "name": user.name}, "token": token}

@router.post("/login", response_model=schemas.AuthResponse)
def login(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.name == user_in.name).first()
    if not user or not utils.verify_password(user_in.password, user.password):
        raise HTTPException(status_code=401, detail="Неверное имя или пароль")

    token = utils.generate_token()
    return {"user": {"id": str(user.id), "name": user.name}, "token": token}
