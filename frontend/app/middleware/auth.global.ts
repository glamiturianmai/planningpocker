import { useAuthStore } from '@/entities/auth/model/use-auth-store';

export default defineNuxtRouteMiddleware((to) => {
  if (!process.client) return;

  const auth = useAuthStore();

  if (to.path !== '/login' && !auth.isAuthenticated) {
    return navigateTo('/login');
  }
});
