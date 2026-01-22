from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from .models import Base
from .routers import auth, rooms

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Planning Poker API")

origins = [
    "http://localhost:3000",
    "https://planningpocker.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(rooms.router)

@app.get("/")
def root():
    return {"message": "Hello backend 👋"}
