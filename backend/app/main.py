from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from .models import Base
from .routers import auth, rooms

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Planning Poker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://vercel.com/alices-projects-db8d1569/planningpocker/FxyoB1kFFNzBeaFgkZhj25gfWQe7"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(rooms.router)

@app.get("/")
def root():
    return {"message": "Hello backend 👋"}
