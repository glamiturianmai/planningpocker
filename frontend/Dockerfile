# Используем Node.js 22 LTS
FROM node:22-alpine

# Рабочая директория внутри контейнера
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем весь код фронтенда
COPY . .

# Строим приложение Nuxt 4 для SPA
RUN npm run build

# Открываем порт Nuxt (по умолчанию 3000)
EXPOSE 3000

# Команда запуска Nuxt 4
CMD ["npm", "run", "preview"]

