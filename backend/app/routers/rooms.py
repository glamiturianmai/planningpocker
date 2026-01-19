from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session, selectinload
from uuid import UUID
from collections import defaultdict

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/rooms", tags=["Rooms"])

room_connections: dict[str, list[WebSocket]] = defaultdict(list)


from ..database import SessionLocal

@router.websocket("/ws/{room_id}")
async def websocket_room(websocket: WebSocket, room_id: str):
    await websocket.accept()
    room_connections[room_id].append(websocket)

    db = SessionLocal()

    try:
        while True:
            data = await websocket.receive_json()

            if "vote" in data:
                user_id = data["user_id"]
                vote = data["vote"]

                player = (
                    db.query(models.Player)
                    .filter_by(room_id=room_id, user_id=user_id)
                    .first()
                )
                if player:
                    player.vote = vote
                    db.commit()

            elif "reveal" in data:
                room = db.query(models.Room).filter_by(id=room_id).first()
                if room:
                    room.revealed = True
                    db.commit()

            elif "reset" in data:
                room = db.query(models.Room).filter_by(id=room_id).first()
                if room:
                    for p in room.players:
                        p.vote = None
                    room.revealed = False
                    db.commit()
                    
            elif "leave" in data:
                user_id = data["user_id"]

                player = (
                    db.query(models.Player)
                    .filter_by(room_id=room_id, user_id=user_id)
                    .first()
                )
                if player:
                    db.delete(player)
                    db.commit()

            room = (
                db.query(models.Room)
                .options(selectinload(models.Room.players))
                .filter_by(id=room_id)
                .first()
            )
            room_out = schemas.RoomOut.model_validate(room)
            room_data = room_out.model_dump(mode="json")

            for conn in room_connections[room_id]:
                await conn.send_json(room_data)


    except WebSocketDisconnect:
        room_connections[room_id].remove(websocket)

    finally:
        db.close()




@router.post("/", response_model=schemas.RoomOut)
def create_room(data: schemas.RoomCreate, db: Session = Depends(get_db)):
    room = models.Room(name=data.name, code=data.code)
    db.add(room)
    db.commit()
    db.refresh(room)

    if data.user_id and data.user_name:
        player = models.Player(
            room_id=room.id,
            user_id=data.user_id,
            name=data.user_name
        )
        db.add(player)
        db.commit()

    room_with_players = db.query(models.Room).options(selectinload(models.Room.players))\
        .filter_by(id=room.id).first()
    return room_with_players


@router.get("/", response_model=list[schemas.RoomOut])
def list_rooms(db: Session = Depends(get_db)):
    return db.query(models.Room).all()


@router.get("/{room_id}", response_model=schemas.RoomOut)
def get_room(room_id: UUID, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(404, "Room not found")
    return room


@router.post("/{room_id}/join", response_model=schemas.RoomOut)
def join_room(room_id: UUID, data: schemas.JoinRoom, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter_by(id=room_id).first()
    if not room:
        raise HTTPException(404, "Room not found")

    player = db.query(models.Player).filter_by(room_id=room_id, user_id=data.user_id).first()
    if not player:
        player = models.Player(room_id=room_id, user_id=data.user_id, name=data.name)
        db.add(player)
        db.commit()

    room = db.query(models.Room).options(selectinload(models.Room.players)).filter_by(id=room_id).first()
    return room


@router.post("/{room_id}/vote")
def vote(room_id: UUID, data: schemas.VoteRequest, db: Session = Depends(get_db)):
    player = db.query(models.Player).filter(models.Player.id == data.id, models.Player.room_id == room_id).first()
    if not player:
        raise HTTPException(404, "Player not in room")

    player.vote = data.vote
    db.commit()

    room = db.query(models.Room).filter(models.Room.id == room_id).options(selectinload(models.Room.players)).first()
    return room
