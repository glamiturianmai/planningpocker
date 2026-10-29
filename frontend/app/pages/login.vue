<template>
  <div class="login-page">
    <div class="login-art">
      <div class="story-cards" aria-hidden="true">
        <span>
          3
          <small>♠</small>
        </span>
        <span>
          5
          <small>♠</small>
        </span>
        <span>
          8
          <small>♠</small>
        </span>
      </div>
      <p class="login-description">Инструмент для планирования</p>
    </div>
    <section class="login-panel" aria-label="Вход и регистрация">
      <div class="segmented" aria-label="Действие с аккаунтом">
        <button :aria-pressed="activeTab === 'login'" @click="setMode('login')">Вход</button>
        <button :aria-pressed="activeTab === 'register'" @click="setMode('register')">
          Регистрация
        </button>
      </div>
      <form :aria-label="activeTab === 'login' ? 'Вход' : 'Регистрация'" @submit.prevent="submit">
        <label class="field">
          Ваше имя
          <input v-model="name" autocomplete="username" required :disabled="busy" />
        </label>
        <label class="field">
          Пароль
          <input
            v-model="password"
            type="password"
            :autocomplete="activeTab === 'login' ? 'current-password' : 'new-password'"
            required
            :disabled="busy"
          />
        </label>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button class="button button-primary" :disabled="busy">
          {{ busy ? 'Подождите…' : activeTab === 'login' ? 'Войти ↗' : 'Создать аккаунт ↗' }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/entities/auth/model/use-auth-store'
const auth = useAuthStore()
const router = useRouter()
const activeTab = ref<'login' | 'register'>('login')
const name = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)
function setMode(mode: 'login' | 'register') {
  activeTab.value = mode
  error.value = ''
}

async function submit() {
  if (busy.value) return
  error.value = ''
  if (!name.value.trim()) {
    error.value = 'Введите имя'
    return
  }
  busy.value = true
  try {
    if (activeTab.value === 'login') await auth.login(name.value.trim(), password.value)
    else await auth.register(name.value.trim(), password.value)
    await router.push('/')
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Не удалось войти. Попробуйте ещё раз.'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: white;
  box-shadow: 0 16px 45px #20372d05;
  overflow: hidden;
}
.login-art {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  min-width: 0;
  padding: 35px;
  background: #eaf0e2;
  border-right: 1px solid var(--line);
}
.login-description {
  font-size: 16px;
  line-height: 1.4;
  font-weight: 500;
  text-align: center;
  color: #5b7358;
}
.story-cards {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 0 0;
}
.story-cards > span {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 98px;
  height: 138px;
  border: 1px solid #cbd9c0;
  background: #f9fbf5;
  border-radius: 12px;
  font-size: 43px;
  font-weight: 600;
  transform: rotate(-16deg);
  box-shadow: 0 7px 18px #20372d0c;
}
.story-cards > span:nth-child(2) {
  transform: translateY(-16px) rotate(-2deg);
  background: var(--accent);
  color: #eef5df;
  border-color: var(--accent);
  margin-left: -14px;
  z-index: 1;
}
.story-cards > span:nth-child(3) {
  transform: rotate(15deg);
  background: var(--lime);
  margin-left: -14px;
}
.story-cards small {
  font-size: 17px;
  font-weight: 400;
}
.login-panel {
  min-width: 0;
  padding: 32px;
}
.segmented {
  margin-bottom: 24px;
}
form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.field {
  font-size: 14px;
}
form .button {
  margin-top: 2px;
  font-size: 14px;
  min-height: 46px;
}
@media (max-width: 800px) {
  .login-page {
    grid-template-columns: minmax(0, 1fr);
    max-width: 400px;
  }
  .login-art {
    gap: 12px;
    min-height: 155px;
    padding: 18px;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }
  .story-cards {
    padding-top: 10px;
  }
  .story-cards > span {
    width: 67px;
    height: 93px;
    font-size: 31px;
    gap: 4px;
    border-radius: 9px;
  }
  .story-cards > span:nth-child(2) {
    transform: translateY(-9px) rotate(-2deg);
  }
  .story-cards small {
    font-size: 13px;
  }
  .login-panel {
    padding: 24px;
  }
  .segmented {
    margin-bottom: 20px;
  }
}
@media (max-height: 650px) {
  .login-panel {
    padding: 20px;
  }
  .segmented {
    margin-bottom: 14px;
  }
  .segmented button {
    padding: 9px 10px;
  }
  form {
    gap: 12px;
  }
  .field {
    gap: 6px;
  }
  .field input {
    min-height: 44px;
    padding: 10px 12px;
  }
  form .button {
    min-height: 44px;
  }
}
@media (max-width: 800px) and (max-height: 650px) {
  .login-art {
    flex-direction: row;
  }
  .login-description {
    max-width: 116px;
    font-size: 12px;
    text-align: left;
  }
  .story-cards {
    flex-shrink: 0;
  }
  .login-page {
    border-radius: 18px;
  }
  .login-art {
    min-height: 68px;
    height: 68px;
    padding: 8px;
  }
  .login-panel {
    padding: 12px;
  }
  .story-cards {
    padding-top: 0;
  }
  .story-cards > span {
    width: 40px;
    height: 56px;
    font-size: 22px;
    gap: 0;
    border-radius: 6px;
  }
  .story-cards > span:nth-child(2) {
    transform: translateY(-4px) rotate(-2deg);
    margin-left: -5px;
  }
  .story-cards > span:nth-child(3) {
    margin-left: -5px;
  }
  .story-cards small {
    font-size: 10px;
  }
}
</style>
