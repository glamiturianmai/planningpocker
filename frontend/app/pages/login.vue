<template>
  <div class="login-page">
    <div class="tabs">
      <button :class="{active: activeTab==='login'}" @click="activeTab='login'">Вход</button>
      <button :class="{active: activeTab==='register'}" @click="activeTab='register'">Регистрация</button>
    </div>

    <div class="form">
      <input v-model="name" placeholder="Имя" />
      <input v-model="password" type="password" placeholder="Пароль" />

      <button v-if="activeTab==='login'" @click="doLogin">Войти</button>
      <button v-if="activeTab==='register'" @click="doRegister">Зарегистрироваться</button>

      <p class="error" v-if="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/entities/auth/model/use-auth-store';

const auth = useAuthStore();
const router = useRouter();

const activeTab = ref<'login'|'register'>('login');
const name = ref('');
const password = ref('');
const error = ref('');

async function doLogin() {
  error.value = '';
  try {
    await auth.login(name.value.trim(), password.value.trim());
    router.push('/');
  } catch (e: any) {
    error.value = e.message;
  }
}


async function doRegister() {
  error.value = '';
  try {
    await auth.register(name.value.trim(), password.value.trim());
    router.push('/');
  } catch (e: any) {
    error.value = e.message;
  }
}
</script>


<style scoped>
.login-page {
  max-width: 420px;
  margin: 120px auto;
  background: #ffffff;
  padding: 32px 28px 36px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(30, 20, 80, 0.08);
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 28px;
  background: #f4f5fb;
  padding: 6px;
  border-radius: 16px;
}

.tabs button {
  flex: 1;
  padding: 10px 0;
  border: none;
  cursor: pointer;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  background: transparent;
  color: #5b5b75;
  transition: all 0.25s ease;
}

.tabs button.active {
  background: #4a00e0;
  color: white;
  box-shadow: 0 8px 20px rgba(74,0,224,0.35);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e2e3f0;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
  background: #fafbff;
}

.form input:focus {
  border-color: #8e2de2;
  box-shadow: 0 0 0 2px rgba(142,45,226,0.15);
  background: #ffffff;
}

.form button {
  margin-top: 10px;
  padding: 14px;
  border-radius: 14px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  color: white;
  background: #4a00e0;
  transition: all 0.25s ease;
}

.form button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(74,0,224,0.35);
}

.error {
  margin-top: 10px;
  font-size: 14px;
  color: #ef4444;
  text-align: center;
}

</style>
