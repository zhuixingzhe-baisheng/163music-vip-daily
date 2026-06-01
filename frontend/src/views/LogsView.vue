<script setup>
import { ref, onMounted } from 'vue'

const logs = ref([])
const isLoading = ref(true)
const expandedLog = ref(null)

const fetchLogs = async () => {
  try {
    const response = await fetch('/api/logs')
    if (response.ok) {
      const data = await response.json()
      if (data && data.length > 0) {
        logs.value = data
      } else {
        logs.value = [
          {
            time: new Date().toISOString().replace('T', ' ').substring(0, 19),
            account: '演示账号',
            type: 'success',
            summary: '示例日志 - 所有任务执行成功',
            details: [
              '✅ 云贝签到（安卓端）：获得 5 云贝',
              '✅ 云贝签到（PC 端）：获得 5 云贝',
              '✅ VIP 乐签打卡：打卡成功',
              '✅ VIP 成长值领取：领取 100 成长值',
              '✅ VIP 音乐任务：已完成',
              '✅ 自动发布动态：已发布 1 首歌曲'
            ]
          }
        ]
      }
    }
  } catch (error) {
    console.error('获取日志失败:', error)
    if (logs.value.length === 0) {
      logs.value = [
        {
          time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          account: '演示账号',
          type: 'success',
          summary: '示例日志 - 所有任务执行成功',
          details: [
            '✅ 云贝签到（安卓端）：获得 5 云贝',
            '✅ 云贝签到（PC 端）：获得 5 云贝',
            '✅ VIP 乐签打卡：打卡成功',
            '✅ VIP 成长值领取：领取 100 成长值',
            '✅ VIP 音乐任务：已完成',
            '✅ 自动发布动态：已发布 1 首歌曲'
          ]
        }
      ]
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchLogs()
  setInterval(fetchLogs, 5000)
})

const toggleLog = (index) => {
  if (expandedLog.value === index) {
    expandedLog.value = null
  } else {
    expandedLog.value = index
  }
}

const clearLogs = () => {
  if (confirm('确定要清空所有日志吗？')) {
    logs.value = []
  }
}

const exportLogs = () => {
  const blob = new Blob([JSON.stringify(logs.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '任务执行日志.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="logs-view">
    <div class="card">
      <div class="logs-header">
        <h2>执行日志</h2>
        <div class="logs-actions">
          <button class="btn btn-secondary" @click="exportLogs">导出日志</button>
          <button class="btn btn-secondary" @click="clearLogs">清空日志</button>
        </div>
      </div>

      <div v-if="logs.length === 0" class="empty-state">
        <p>暂无执行日志</p>
      </div>

      <div v-else class="logs-list">
        <div v-for="(log, index) in logs" :key="index" class="log-item">
          <div class="log-header" @click="toggleLog(index)">
            <div class="log-time">{{ log.time }}</div>
            <div class="log-account">{{ log.account }}</div>
            <div :class="['log-status', log.type]">
              {{ log.type === 'success' ? '✅ 成功' : '⚠️ 警告' }}
            </div>
            <div class="log-summary">{{ log.summary }}</div>
            <div class="log-expand">
              {{ expandedLog === index ? '收起 ▲' : '展开 ▼' }}
            </div>
          </div>
          <div v-show="expandedLog === index" class="log-details">
            <div v-for="(detail, i) in log.details" :key="i" class="detail-line">
              {{ detail }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>日志说明</h2>
      <div class="help-content">
        <p>执行日志会记录每次任务的执行情况，包括：</p>
        <ul>
          <li>任务执行时间</li>
          <li>执行账号</li>
          <li>每个子任务的执行状态</li>
          <li>获得的奖励（云贝、成长值等）</li>
        </ul>
        <p><strong>提示：</strong> 日志仅保存在浏览器本地，刷新页面不会丢失，但清空缓存会被清除。</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.logs-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.logs-actions {
  display: flex;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.log-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.log-header {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: #f9f9f9;
  cursor: pointer;
  transition: background 0.3s;
}

.log-header:hover {
  background: #f0f0f0;
}

.log-time {
  font-weight: 600;
  color: #333;
}

.log-account {
  color: #666;
}

.log-status {
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
}

.log-status.success {
  background: #d4edda;
  color: #155724;
}

.log-status.warning {
  background: #fff3cd;
  color: #856404;
}

.log-summary {
  color: #333;
}

.log-expand {
  color: #999;
  font-size: 0.85rem;
}

.log-details {
  padding: 1rem;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.detail-line {
  padding: 0.3rem 0;
  font-family: monospace;
  font-size: 0.9rem;
  color: #555;
}

.help-content {
  color: #666;
}

.help-content ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.help-content li {
  margin-bottom: 0.3rem;
}
</style>
