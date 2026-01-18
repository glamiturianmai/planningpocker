from sqlalchemy import Column, String, Boolean, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from sqlalchemy import UniqueConstraint

from .database import Base

class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "planning_poker"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)


class Room(Base):
    __tablename__ = "rooms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    revealed = Column(Boolean, default=False)

    players = relationship(
        "Player",
        backref="room",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

class Player(Base):
    __tablename__ = "players"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)

    room_id = Column(
        UUID(as_uuid=True),
        ForeignKey("rooms.id", ondelete="CASCADE"),
        nullable=False
    )

    name = Column(String, nullable=False)
    vote = Column(Integer, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "room_id", name="uq_player_user_room"),
    )