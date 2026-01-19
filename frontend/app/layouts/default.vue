<template>
  <div class="app">
    <header class="header">
      <NuxtLink to="/" class="logo">
        Planning Poker
      </NuxtLink>

      <div v-if="auth.isAuthenticated" class="user">
        <span class="user-name"> {{ auth.user?.name }}</span>
        <button class="logout" @click="logout">Выйти</button>
      </div>
    </header>

    <main class="content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/entities/auth/model/use-auth-store'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f6f7fb;
  color: #4a00e0;
}


.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f6f7fb;
}

.header {
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}


.logo {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-decoration: none; /* ← убрали подчёркивание */
  color: #4a00e0;
}

.logo:hover {
  opacity: 0.9;
}


.user {
  display: flex;
  align-items: center;
  gap: 12px;

  background: #4a00e0;
  padding: 6px 14px;
  border-radius: 999px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #e5e7eb;
  white-space: nowrap;
}

.logout {
  border: none;
  padding: 4px 10px;
  border-radius: 999px;

  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  background: rgba(255, 255, 255, 0.1);
  color: #e5e7eb;

  transition: background 0.2s ease, color 0.2s ease;
}

.logout:hover {
  color: white;
}


.content {
  flex: 1;
  padding: 32px 20px;
}


</style>
