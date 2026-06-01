<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>网易云音乐自动任务管理</h1>
      <nav>
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/config">账号配置</RouterLink>
        <RouterLink to="/tasks">任务管理</RouterLink>
        <RouterLink to="/logs">执行日志</RouterLink>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #e60026 0%, #ff4d4f 100%);
  color: white;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.app-header h1 {
  margin: 0 0 1rem 0;
  font-size: 1.8rem;
}

.app-header nav {
  display: flex;
  gap: 1.5rem;
}

.app-header nav a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.3s;
}

.app-header nav a:hover,
.app-header nav a.router-link-active {
  background: rgba(255,255,255,0.2);
}

.app-main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>
