from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from pydantic import ConfigDict

class UserCreate(BaseModel):
    name: str
    password: str

class UserOut(BaseModel):
    id: UUID
    name: str

class AuthResponse(BaseModel):
    user: UserOut
    token: str


class RoomCreate(BaseModel):
    name: str
    code: str
    user_id: Optional[UUID] = None
    user_name: Optional[str] = None

from typing import List, Optional


class PlayerOut(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    name: str
    vote: Optional[int]

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={UUID: str},
    )


class RoomOut(BaseModel):
    id: UUID
    name: str
    code: Optional[str]
    revealed: bool
    players: List[PlayerOut]

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={UUID: str},
    )

class JoinRoomRequest(BaseModel):
    id: UUID
    name: str

class VoteRequest(BaseModel):
    id: UUID
    vote: int

class JoinRoom(BaseModel):
    user_id: UUID
    name: str
