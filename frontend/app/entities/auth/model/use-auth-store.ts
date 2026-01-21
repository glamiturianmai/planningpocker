import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthApi } from '../../../api/auth';

const TOKEN_KEY = 'pp-token';
const USER_KEY = 'pp-user';

export const useAuthStore = defineStore('authStore', () => {
  const { loginApi, registerApi } = useAuthApi()

  const token = ref<string | null>(process.client ? localStorage.getItem(TOKEN_KEY) : null);
  const user = ref<{ id: string; name: string } | null>(
    process.client ? JSON.parse(localStorage.getItem(USER_KEY) || 'null') : null
  );

  const isAuthenticated = computed(() => !!token.value);

  async function login(name: string, password: string) {
    const res = await loginApi(name, password);
    token.value = res.token;
    user.value = res.user;
    if (process.client) {
      localStorage.setItem(TOKEN_KEY, token.value);
      localStorage.setItem(USER_KEY, JSON.stringify(user.value));
    }
  }

  async function register(name: string, password: string) {
    const res = await registerApi(name, password);
    token.value = res.token;
    user.value = res.user;
    if (process.client) {
      localStorage.setItem(TOKEN_KEY, token.value);
      localStorage.setItem(USER_KEY, JSON.stringify(user.value));
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    if (process.client) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  return { token, user, isAuthenticated, login, register, logout };
});
