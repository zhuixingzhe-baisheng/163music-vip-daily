<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '../stores/config'

const router = useRouter()
const configStore = useConfigStore()
const isExecuting = ref(false)
const showMessage = ref(false)
const messageType = ref('')
const messageText = ref('')
const realTimeLogs = ref([])
const eventSource = ref(null)
const logsContainer = ref(null)

const executeTaskTitle = computed(() => {
  return isExecuting.value ? '执行中...' : '立即执行'
})

const executeDescription = computed(() => {
  return isExecuting.value ? '任务正在后台执行，请稍候' : '手动触发一次所有任务'
})

const executeDescriptionIcon = computed(() => {
  return isExecuting.value ? '⏳' : '▶️'
})

const connectToRealTimeLogs = () => {
  if (eventSource.value) {
    eventSource.value.close()
  }
  
  eventSource.value = new EventSource('/api/realtime-logs')
  
  eventSource.value.onmessage = (event) => {
    try {

      const log = JSON.parse(event.data)
      realTimeLogs.value.push(log)
      
      if (realTimeLogs.value.length > 20) {
        realTimeLogs.value.shift()
      }
      
      if (logsContainer.value) {
        nextTick(() => {
          logsContainer.value.scrollTop = logsContainer.value.scrollHeight
        })
      }
    } catch (e) {
      console.error('解析日志失败:', e)
    }
  }
  
  eventSource.value.onerror = (error) => {
    console.error('SSE 连接错误:', error)
    eventSource.value.close()
    setTimeout(connectToRealTimeLogs, 3000)
  }
}

const checkExecutionStatus = async () => {
  try {
    const response = await fetch('/api/execution-status')
    if (response.ok) {
      const data = await response.json()
      isExecuting.value = data.executing
    }
  } catch (error) {
    console.error('检查执行状态失败:', error)
  }
}

const isAnyAccountExecuting = () => {
  return isExecuting.value
}

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
  if (isExecuting.value) {
    showMessage.value = true
    messageType.value = 'warning'
    messageText.value = '任务正在执行中，请稍候...'
    setTimeout(() => {
      showMessage.value = false
    }, 3000)
    return
  }
  
  if (isAnyAccountExecuting()) {
    showMessage.value = true
    messageType.value = 'warning'
    messageText.value = '有其他账号正在执行任务，请稍后再试'
    setTimeout(() => {
      showMessage.value = false
    }, 3000)
    return
  }
  
  console.log('当前配置的账号数量:', configStore.users.length)
  console.log('当前配置详情:', configStore.exportConfig())
  
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
  realTimeLogs.value = []
  
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

const stopExecution = async () => {
  try {
    await fetch('/api/stop', { method: 'POST' })
    isExecuting.value = false
    const stopLog = {
      type: 'stopped',
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      message: '⏹️ 任务已停止'
    }
    realTimeLogs.value.push(stopLog)
  } catch (error) {
    console.error('停止执行失败:', error)
  }
}

onMounted(() => {
  checkExecutionStatus()
  connectToRealTimeLogs()
})

onUnmounted(() => {
  if (eventSource.value) {
    eventSource.value.close()
  }
})
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

    <div class="card real-time-logs-card">
      <div class="logs-header">
        <h2>实时日志</h2>
        <div class="logs-actions">
          <button v-if="isExecuting" class="btn-stop" @click="stopExecution">⏹️ 停止执行</button>
          <span class="connection-status" :class="{ connected: eventSource !== null }">
            {{ eventSource ? '🟢 已连接' : '🔴 未连接' }}
          </span>
        </div>
      </div>
      <div ref="logsContainer" class="real-time-logs-terminal">
        <div v-if="realTimeLogs.length === 0" class="empty-logs">
          <p>暂无执行日志，点击上方"立即执行"按钮开始任务</p>
        </div>
        <div v-else class="logs-content">
          <div v-for="(log, index) in realTimeLogs" :key="index" :class="['log-line', log.type]">
            <span class="log-timestamp">[{{ log.time.split(' ')[1] }}]</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
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

.real-time-logs-card {
  padding: 0;
  overflow: hidden;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #2d2d2d;
  color: #fff;
}

.logs-header h2 {
  margin: 0;
  color: #fff;
  font-size: 1rem;
}

.logs-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-stop {
  padding: 0.4rem 0.8rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}

.btn-stop:hover {
  background: #c82333;
}

.connection-status {
  font-size: 0.85rem;
  color: #999;
}

.connection-status.connected {
  color: #4caf50;
}

.real-time-logs-terminal {
  max-height: 400px;
  overflow-y: auto;
  background: #1e1e1e;
  padding: 1rem;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
}

.empty-logs {
  padding: 3rem;
  text-align: center;
  color: #666;
}

.logs-content {
  display: flex;
  flex-direction: column;
}

.log-line {
  padding: 0.3rem 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-line.start {
  color: #4fc3f7;
}

.log-line.info {
  color: #fff;
}

.log-line.task {
  color: #81c784;
}

.log-line.complete {
  color: #ffd54f;
  font-weight: bold;
}

.log-line.error {
  color: #e57373;
}

.log-line.stopped {
  color: #ffb74d;
}

.log-timestamp {
  color: #757575;
  margin-right: 0.5rem;
}

.log-message {
  color: inherit;
}

.real-time-logs-terminal::-webkit-scrollbar {
  width: 8px;
}

.real-time-logs-terminal::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.real-time-logs-terminal::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}

.real-time-logs-terminal::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
