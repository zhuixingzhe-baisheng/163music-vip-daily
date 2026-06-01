<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '../stores/config'

const router = useRouter()
const configStore = useConfigStore()
const isExecuting = ref(false)
const showMessage = ref(false)
const messageType = ref('')
const messageText = ref('')

const executeTaskTitle = computed(() => {
  return isExecuting.value ? '执行中...' : '立即执行'
})

const executeDescription = computed(() => {
  return isExecuting.value ? '任务正在后台执行，请稍候' : '手动触发一次所有任务'
})

const executeDescriptionIcon = computed(() => {
  return isExecuting.value ? '⏳' : '▶️'
})

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
  }
])

const handleAction = (action) => {
  router.push(action.link)
}

const executeAllTasks = async () => {
  if (isExecuting.value) return
  
  if (configStore.users.length === 0) {
    showMessage.value = true
    messageType.value = 'warning'
    messageText.value = '请先添加至少一个账号再执行任务'
    setTimeout(() => {
      showMessage.value = false
    }, 3000)
    return
  }
  
  isExecuting.value = true
  
  try {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        config: configStore.exportConfig()
      })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      showMessage.value = true
      messageType.value = 'success'
      messageText.value = '任务执行成功！已记录到执行日志'
    } else {
      showMessage.value = true
      messageType.value = 'error'
      messageText.value = `任务执行失败：${result.message || '未知错误'}`
    }
  } catch (error) {
    showMessage.value = true
    messageType.value = 'error'
    messageText.value = `网络错误：${error.message}`
  } finally {
    setTimeout(() => {
      isExecuting.value = false
      showMessage.value = false
    }, 3000)
  }
}
</script>

<template>
  <div class="home-view">
    <div v-if="showMessage" :class="['message', `message-${messageType}`]">
      {{ messageText }}
    </div>
    
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
        
        <div 
          class="action-card execute-card"
          :class="{ executing: isExecuting }"
          @click="executeAllTasks"
        >
          <div class="action-icon">{{ executeDescriptionIcon }}</div>
          <h3>{{ executeTaskTitle }}</h3>
          <p>{{ executeDescription }}</p>
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

.message {
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
  animation: slideDown 0.3s ease-out;
}

.message-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message-warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-card h2 {
  color: #e60026;
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

.execute-card.executing {
  background: #e6f7ff;
  cursor: not-allowed;
}

.execute-card.executing:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
</style>
