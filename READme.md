# Planning Poker

**Planning Poker** — это приложение для командного планирования и оценки задач в формате "покер для планирования". Пользователи создают комнаты, голосуют за задачи и видят результаты после открытия карт.

```
planningpocker/
├─ frontend/ # Nuxt3 фронтенд
│ ├─ components/ 
│ ├─ composables/
│ ├─ entities/ 
│ ├─ features/ 
│ ├─ pages/ # страницы Nuxt (index.vue, [roomId].vue)
│ ├─ plugins/ # плагины Nuxt
│ ├─ public/
│ ├─ styles/ 
│ ├─ utils/
│ ├─ api/ # API запросы и WebSocket функции
│ ├─ app.vue
│ └─ nuxt.config.ts
│
├─ backend/ # FastAPI бэкенд
│ ├─ app/
│ │ ├─ models.py # SQLAlchemy модели
│ │ ├─ schemas.py # Pydantic схемы
│ │ ├─ database.py # подключение к базе, SessionLocal
│ │ ├─ routers/ # REST API и WebSocket роуты
│ │ │ ├─ auth.py
│ │ │ └─ rooms.py
│ │ ├─ main.py # точка входа FastAPI приложения
│ │ └─ init.py
│ ├─ requirements.txt # зависимости Python
│ └─ .env.example
```