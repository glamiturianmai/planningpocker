from sqlalchemy.orm import Session
from uuid import uuid4

from . import models, schemas


def get_rooms(db: Session):
    return db.query(models.Room).all()


def get_room(db: Session, room_id):
    return db.query(models.Room).filter(models.Room.id == room_id).first()

