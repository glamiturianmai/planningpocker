export type User = { id: string; name: string };

const API_URL = 'http://127.0.0.1:8000';

export async function login(name: string, password: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password }),
  });
  if (!res.ok) throw new Error('Неверное имя или пароль');
  return res.json();
}

export async function register(name: string, password: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password }),
  });
  if (!res.ok) throw new Error('Ошибка регистрации');
  return res.json();
}
