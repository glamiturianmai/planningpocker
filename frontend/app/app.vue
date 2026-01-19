<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
body { margin: 0; font-family: system-ui, sans-serif; background: #f1f5f9; }

.app { min-height: 100vh; display: flex; flex-direction: column; }

.header {
  height: 60px;
  background: #1e293b;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 20px;
  justify-content: space-between;
}

.logo { font-weight: bold; text-decoration: none; color: white; font-size: 18px; }

.user {
  background: #334155;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.logout {
  background: #ef4444;
  border: none;
  padding: 4px 8px;
  color: white;
  border-radius: 6px;
  cursor: pointer;
}
.logout:hover { background: #dc2626; }

.content { flex: 1; padding: 20px; }
</style>
