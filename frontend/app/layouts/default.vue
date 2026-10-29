<template>
  <div
    class="app"
    :class="{ 'room-layout': isRoom, 'lobby-layout': isLobby, 'login-layout': isLogin }"
  >
    <header class="header">
      <NuxtLink to="/" class="logo" aria-label="Planning Poker — главная">
        <span class="brand-mark" aria-hidden="true">
          <span class="brand-card">
            <svg width="19" height="23" viewBox="0 0 24 28" fill="currentColor">
              <path
                d="M12 2C9 6 2 10 2 15a6 6 0 0 0 10 4 6 6 0 0 0 10-4c0-5-7-9-10-13Zm-2 18-2 6h8l-2-6Z"
              />
            </svg>
          </span>
        </span>
        <span class="brand-name">
          planning
          <span class="logo-light">poker</span>
        </span>
      </NuxtLink>
      <ClientOnly>
        <div v-if="auth.isAuthenticated" class="user">
          <span class="user-name">{{ auth.user?.name }}</span>
          <button class="logout" @click="logout">Выйти</button>
        </div>
      </ClientOnly>
    </header>
    <main class="content"><slot /></main>
    <footer v-if="!isRoom && !isLobby && !isLogin" class="footer">
      <span>Сначала думаем сами, потом обсуждаем вместе.</span>
      <span>Planning Poker · для команды</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/entities/auth/model/use-auth-store'
const auth = useAuthStore()
const route = useRoute()
const isLogin = computed(() => route.path === '/login')
const isLobby = computed(() => route.path === '/')
const isRoom = computed(() => route.path.startsWith('/room/'))
function logout() {
  auth.logout()
  navigateTo('/login')
}
</script>

<style scoped>
.app {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
.header {
  min-height: 88px;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px clamp(20px, 5vw, 80px);
  border-bottom: 1px solid var(--line);
  background: #ffffff80;
}
.logo {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 11px;
  font-size: 21px;
  font-weight: 650;
  letter-spacing: -0.8px;
  text-decoration: none;
}
.logo-light {
  font-weight: 450;
}
.brand-mark {
  position: relative;
  width: 38px;
  height: 43px;
  flex-shrink: 0;
}
.brand-mark::before {
  content: '';
  position: absolute;
  inset: 2px 7px 2px 0;
  border: 1px solid #b5c99e;
  border-radius: 7px;
  background: var(--lime);
  transform: rotate(-15deg);
}
.brand-card {
  position: absolute;
  inset: 0 0 3px 6px;
  display: grid;
  place-items: center;
  border: 1px solid #204d38;
  border-radius: 7px;
  background: var(--accent);
  color: #e9f4d6;
  transform: rotate(5deg);
}
.brand-name {
  white-space: nowrap;
}
.user {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  font-size: 13px;
}

.user-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.logout {
  flex-shrink: 0;
  border: 0;
  background: none;
  color: var(--muted);
  margin-left: 9px;
  padding: 8px;
}
.logout:hover {
  color: var(--ink);
}
.content {
  flex: 1;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 42px 32px 60px;
}
.footer {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 22px clamp(20px, 5vw, 80px);
  border-top: 1px solid var(--line);
  font-size: 11px;
  color: var(--muted);
}
@media (max-width: 700px) {
  .header {
    min-height: 74px;
    padding: 16px 20px;
  }
  .header {
    gap: 12px;
  }
  .user-name {
    max-width: 70px;
  }
  .content {
    padding: 28px 18px 40px;
  }
  .footer {
    flex-direction: column;
    gap: 8px;
  }
}
.lobby-layout .content {
  padding-top: 24px;
  padding-bottom: 24px;
}
.room-layout {
  height: 100dvh;
  min-height: 0;
}
.room-layout .header,
.login-layout .header {
  min-height: 64px;
  height: 64px;
  flex-shrink: 0;
  padding: 10px 28px;
}
.room-layout .brand-mark,
.login-layout .brand-mark {
  width: 32px;
  height: 36px;
}
.room-layout .logo,
.login-layout .logo {
  font-size: 19px;
}
.room-layout .content {
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-width: 1440px;
  padding: 16px 28px;
}
@media (max-width: 700px) {
  .room-layout .header,
  .login-layout .header {
    height: 58px;
    min-height: 58px;
    padding: 8px 16px;
  }
  .room-layout .content {
    padding: 12px 16px;
  }
}
.login-layout .content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 24px;
}
@media (max-width: 700px) {
  .login-layout .content {
    padding: 12px 16px;
  }
}
@media (max-height: 650px) {
  .login-layout .header {
    min-height: 56px;
    height: 56px;
    padding-block: 8px;
  }
  .login-layout .content {
    padding-block: 12px;
  }
}
</style>
