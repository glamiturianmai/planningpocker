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
  max-width: 400px;
  margin: 100px auto;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.tabs {
  display: flex;
  margin-bottom: 20px;
}

.tabs button {
  flex: 1;
  padding: 10px;
  border: none;
  background: #f1f5f9;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  font-weight: bold;
}

.tabs button.active {
  background: #4caf50;
  color: white;
}

.form input {
  display: block;
  width: 100%;
  margin-bottom: 12px;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.form button {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: none;
  background: #4caf50;
  color: white;
  cursor: pointer;
}

.form button:hover {
  background: #43a047;
}

.error {
  color: red;
  margin-top: 10px;
  text-align: center;
}

.users-list {
  margin-top: 20px;
  text-align: left;
  background: #f1f5f9;
  padding: 10px;
  border-radius: 6px;
  overflow-y: auto;
}

.users-list ul {
  list-style: none;
  padding-left: 10px;
}

.users-list li {
  padding: 4px 0;
  border-bottom: 1px solid #e2e8f0;
}

.users-list {
  margin-top: 20px;
  text-align: left;
}

.users-list table {
  width: 100%;
  border-collapse: collapse;
  background: #f1f5f9;
  border-radius: 6px;
  overflow: hidden;
}

.users-list th, .users-list td {
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}

.users-list th {
  background: #334155;
  color: white;
  font-weight: normal;
}

.users-list tbody tr:hover {
  background: #e2e8f0;
}
</style>
