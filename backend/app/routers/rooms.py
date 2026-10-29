from collections import defaultdict
from uuid import UUID

from emoji import is_emoji

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas
from ..database import SessionLocal, get_db

router = APIRouter(prefix="/rooms", tags=["Rooms"])
room_connections: dict[str, list[WebSocket]] = defaultdict(list)
MAX_VOTE = 2_147_483_647


def disconnect_room(room_id: str, connection: WebSocket):
    connections = room_connections.get(room_id, [])
    if connection in connections:
        connections.remove(connection)
    if not connections:
        room_connections.pop(room_id, None)


async def broadcast_room(room_id: str, data: dict):
    for connection in tuple(room_connections.get(room_id, [])):
        try:
            await connection.send_json(data)
        except (WebSocketDisconnect, RuntimeError, OSError):
            disconnect_room(room_id, connection)


def room_snapshot(db: Session, room_id: UUID) -> dict:
    room = db.query(models.Room).options(selectinload(models.Room.players)).filter_by(id=room_id).first()
    if not room:
        raise HTTPException(404, "Room not found")
    return schemas.RoomOut.model_validate(room).model_dump(mode="json")


def apply_room_command(db: Session, room_id: UUID, data: dict):
    if "vote" in data:
        vote = data["vote"]
        if type(vote) is not int or not 0 <= vote <= MAX_VOTE:
            raise ValueError(f"Введите целое число от 0 до {MAX_VOTE}")
        player = db.query(models.Player).filter_by(room_id=room_id, user_id=UUID(data["user_id"])).first()
        if player:
            player.vote = vote
    elif "reveal" in data:
        db.query(models.Room).filter_by(id=room_id).first().revealed = True
    elif "reset" in data:
        room = db.query(models.Room).filter_by(id=room_id).first()
        for player in room.players:
            player.vote = None
        room.revealed = False
    elif "leave" in data:
        player = db.query(models.Player).filter_by(room_id=room_id, user_id=UUID(data["user_id"])).first()
        if player:
            db.delete(player)
    else:
        raise ValueError("Неизвестная команда комнаты")
    db.commit()


def execute_room_message(db: Session, room_id: UUID, data: dict) -> dict:
    if not isinstance(data, dict):
        raise ValueError("Ожидается сообщение комнаты")
    if "reaction" not in data:
        apply_room_command(db, room_id, data)
        return room_snapshot(db, room_id)

    snapshot = room_snapshot(db, room_id)
    player_ids = {player["user_id"] for player in snapshot["players"]}
    reaction = data.get("reaction")
    if not isinstance(reaction, str) or not is_emoji(reaction.replace("\ufe0f", "")) or data.get("user_id") not in player_ids:
        raise ValueError("Неизвестная реакция или участник")
    if data.get("target_user_id") is not None and data["target_user_id"] not in player_ids:
        raise ValueError("Участник уже вышел из комнаты")
    side = data.get("side", "left")
    if side not in ("left", "right"):
        raise ValueError("Неизвестная сторона броска")
    return {
        "side": side,
        "style": "throw",
        "type": "reaction", "emoji": data["reaction"],
        "user_id": data["user_id"], "target_user_id": data.get("target_user_id"),
    }


async def receive_room_message(websocket: WebSocket, room_id: UUID):
    try:
        data = await websocket.receive_json()
        with SessionLocal() as db:
            event = execute_room_message(db, room_id, data)
    except (ValueError, KeyError, TypeError) as error:
        await websocket.send_json({"type": "error", "message": str(error)})
        return
    await broadcast_room(str(room_id), event)


@router.websocket("/ws/{room_id}")
async def websocket_room(websocket: WebSocket, room_id: UUID):
    await websocket.accept()
    room_key = str(room_id)
    room_connections[room_key].append(websocket)
    try:
        with SessionLocal() as db:
            initial_state = room_snapshot(db, room_id)
        await broadcast_room(room_key, initial_state)
        while True:
            await receive_room_message(websocket, room_id)
    except WebSocketDisconnect:
        pass
    except HTTPException:
        await websocket.close(code=1008, reason="Room not found")
    finally:
        disconnect_room(room_key, websocket)


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
