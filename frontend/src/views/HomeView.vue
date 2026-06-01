<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const quickActions = ref([
  {
    title: '配置账号',
    description: '添加或编辑网易云音乐账号',
    icon: '👤',
    link: '/config'
  },
  {
    title: '管理任务',
    description: '配置自动任务开关和参数',
    icon: '⚙️',
    link: '/tasks'
  },
  {
    title: '查看日志',
    description: '查看任务执行历史和状态',
    icon: '📋',
    link: '/logs'
  },
  {
    title: '立即执行',
    description: '手动触发一次所有任务',
    icon: '▶️',
    action: 'execute'
  }
])

const handleAction = (action) => {
  if (action.action === 'execute') {
    alert('任务执行功能开发中...')
  }
}
</script>

<template>
  <div class="home-view">
    <div class="welcome-card card">
      <h2>欢迎使用网易云音乐自动任务管理</h2>
      <p>这是一个可视化的任务管理界面，帮助您轻松配置和管理网易云音乐自动任务。</p>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">5</div>
          <div class="stat-label">支持的任务类型</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">24/7</div>
          <div class="stat-label">自动运行</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">多账号</div>
          <div class="stat-label">同时管理</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>快捷操作</h2>
      <div class="actions-grid">
        <div 
          v-for="action in quickActions" 
          :key="action.title"
          class="action-card"
          @click="handleAction(action)"
        >
          <div class="action-icon">{{ action.icon }}</div>
          <h3>{{ action.title }}</h3>
          <p>{{ action.description }}</p>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>功能特性</h2>
      <div class="features-list">
        <div class="feature-item">
          <span class="feature-icon">✅</span>
          <div>
            <strong>云贝签到</strong>
            <p>每日自动进行安卓端和 PC 端云贝签到</p>
          </div>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🎫</span>
          <div>
            <strong>VIP 乐签打卡</strong>
            <p>VIP 用户每日乐签打卡，保持活跃度</p>
          </div>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📈</span>
          <div>
            <strong>VIP 成长值领取</strong>
            <p>自动领取已完成任务的 VIP 成长值</p>
          </div>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🎵</span>
          <div>
            <strong>VIP 音乐任务</strong>
            <p>自动完成收藏歌曲、听歌记录等任务</p>
          </div>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📱</span>
          <div>
            <strong>自动发布动态</strong>
            <p>每日自动分享歌曲到网易云音乐动态</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.welcome-card h2 {
  color: #e60026;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #e60026;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-card {
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.action-card:hover {
  background: #fff0f0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.action-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.action-card h3 {
  margin: 0.5rem 0;
  color: #333;
}

.action-card p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feature-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.feature-icon {
  font-size: 1.5rem;
}

.feature-item strong {
  display: block;
  margin-bottom: 0.3rem;
  color: #333;
}

.feature-item p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}
</style>
