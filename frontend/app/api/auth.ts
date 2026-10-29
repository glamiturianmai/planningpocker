type AuthResponse = {
  user: { id: string; name: string }
  token: string
}

export function useAuthApi() {
  const config = useRuntimeConfig()
  const API_URL = config.public.apiUrl

  async function loginApi(name: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password }),
    })

    if (!res.ok) throw new Error('Неверное имя или пароль')
    return res.json()
  }

  async function registerApi(name: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password }),
    })

    if (!res.ok) throw new Error('Ошибка регистрации')
    return res.json()
  }

  return { loginApi, registerApi }
}
