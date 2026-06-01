<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>网易云音乐自动任务配置</h1>
      <nav>
        <RouterLink to="/config">账号配置</RouterLink>
        <RouterLink to="/settings">任务设置</RouterLink>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
    <footer class="app-footer">
      <p>配置会自动保存到 config.json 文件</p>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.app-header {
  background: linear-gradient(135deg, #e60026 0%, #ff4d4f 100%);
  color: white;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.app-header h1 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.app-header nav {
  display: flex;
  gap: 1rem;
}

.app-header nav a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.3s;
  font-weight: 500;
}

.app-header nav a:hover,
.app-header nav a.router-link-active {
  background: rgba(255,255,255,0.2);
}

.app-main {
  flex: 1;
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.app-footer {
  background: #333;
  color: #999;
  text-align: center;
  padding: 1rem;
  font-size: 0.85rem;
}

.app-footer p {
  margin: 0;
}
</style>
