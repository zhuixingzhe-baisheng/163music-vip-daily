<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfigStore } from '../stores/config'

const configStore = useConfigStore()
const errorMsg = ref('')
const successMsg = ref('')
const currentChannel = ref('')

// 初始化时根据已有配置设置当前渠道
onMounted(() => {
  if (configStore.settings.serverSendKey) {
    currentChannel.value = 'server'
  } else if (configStore.settings.pushplusToken) {
    currentChannel.value = configStore.settings.pushplusChannel || 'wechat'
  }
})

const onChannelChange = () => {
  // 切换渠道时，更新 pushplusChannel 设置
  if (currentChannel.value !== 'server') {
    configStore.updateSetting('pushplusChannel', currentChannel.value)
  }
  saveSettings()
}

const clearMessages = () => {
  setTimeout(() => {
    errorMsg.value = ''
    successMsg.value = ''
  }, 3000)
}

const features = [
  { key: 'enableYunbeiSign', label: '云贝签到（安卓端）', description: '每日自动进行安卓端云贝签到' },
  { key: 'enableYunbeiSignPC', label: '云贝签到（PC 端）', description: '每日自动进行 PC 端云贝签到' },
  { key: 'enableVipSign', label: 'VIP 乐签打卡', description: 'VIP 用户每日乐签打卡' },
  { key: 'showVipTaskList', label: '显示 VIP 任务列表', description: '执行前显示 VIP 任务列表' },
  { key: 'enableVipGrowthpoint', label: 'VIP 成长值领取', description: '自动领取已完成任务的成长值' },
  { key: 'enableVipMusicTasks', label: 'VIP 音乐任务', description: '自动完成收藏、听歌等任务' },
  { key: 'enableAutoPost', label: '自动发布动态', description: '每日自动分享歌曲到动态' },
  { key: 'deletePreviousPost', label: '删除上次动态', description: '发布新动态前删除之前的动态' }
]

const validateAndSave = () => {
  errorMsg.value = ''
  
  if (configStore.settings.serverSendKey && !configStore.validateServerSendKey(configStore.settings.serverSendKey)) {
    errorMsg.value = 'Server 酱 SendKey 格式不正确，应以 SCT 开头'
    clearMessages()
    return false
  }
  
  if (configStore.settings.pushplusToken && !configStore.validatePushplusToken(configStore.settings.pushplusToken)) {
    errorMsg.value = 'PushPlus Token 格式不正确，长度至少 10 位'
    clearMessages()
    return false
  }
  
  return true
}

const updateSetting = (key, value) => {
  configStore.updateSetting(key, value)
}

const saveSettings = () => {
  if (validateAndSave()) {
    successMsg.value = '配置已保存'
    clearMessages()
  }
}
</script>

<template>
  <div class="settings-view">
    <div v-if="errorMsg" class="message error-message">{{ errorMsg }}</div>
    <div v-if="successMsg" class="message success-message">{{ successMsg }}</div>
    
    <div class="card">
      <h2>任务开关配置</h2>
      <div class="features-grid">
        <div v-for="feature in features" :key="feature.key" class="feature-item">
          <div class="feature-info">
            <h3>{{ feature.label }}</h3>
            <p>{{ feature.description }}</p>
          </div>
          <label class="switch">
            <input 
              type="checkbox" 
              :checked="configStore.settings[feature.key]" 
              @change="updateSetting(feature.key, $event.target.checked)"
            />
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>VIP 任务高级配置</h2>
      <div class="advanced-settings">
        <div class="form-group">
          <label>会员雷达歌单 ID</label>
          <input 
            type="text" 
            v-model="configStore.settings.vipMusicPlaylistId"
            placeholder="8402996200"
            @blur="saveSettings"
          />
        </div>
        <div class="form-group">
          <label>处理歌曲数量</label>
          <input 
            type="number" 
            v-model.number="configStore.settings.vipMusicSongCount"
            min="1"
            max="10"
            @blur="saveSettings"
          />
        </div>
        <div class="form-group">
          <label>发布动态歌单 ID</label>
          <input 
            type="text" 
            v-model="configStore.settings.postPlaylistId"
            placeholder="8402996200"
            @blur="saveSettings"
          />
        </div>
        <div class="form-group">
          <label>每次发布歌曲数</label>
          <input 
            type="number" 
            v-model.number="configStore.settings.postSongCount"
            min="1"
            max="3"
            @blur="saveSettings"
          />
        </div>
      </div>
    </div>

    <div class="card">
      <h2>消息推送配置</h2>
      <div class="advanced-settings">
        <div class="form-group full-width">
          <label>推送渠道</label>
          <select v-model="currentChannel" @change="onChannelChange">
            <option value="">不使用推送</option>
            <option value="server">Server 酱</option>
            <option value="wechat">微信公众号 (PushPlus)</option>
            <option value="wechatcp">企业微信 (PushPlus)</option>
            <option value="corp">企业微信 (PushPlus)</option>
            <option value="sms">短信 (PushPlus)</option>
            <option value="webhook">Webhook (PushPlus)</option>
          </select>
        </div>

        <!-- Server 酱配置 -->
        <div v-if="currentChannel === 'server'" class="form-group full-width">
          <label>Server 酱 SendKey</label>
          <input 
            type="text" 
            v-model="configStore.settings.serverSendKey"
            placeholder="SCTxxxxxxxx"
            @blur="saveSettings"
          />
          <small class="help-text">以 SCT 开头的字符串，例如：SCT12345</small>
        </div>

        <!-- PushPlus 配置 -->
        <div v-if="['wechat', 'wechatcp', 'corp', 'sms', 'webhook'].includes(currentChannel)" class="form-group full-width">
          <label>PushPlus Token</label>
          <input 
            type="text" 
            v-model="configStore.settings.pushplusToken"
            placeholder="你的 token"
            @blur="saveSettings"
          />
          <small class="help-text">PushPlus 推送令牌，长度至少 10 位</small>
        </div>

        <!-- Webhook 地址 -->
        <div v-if="currentChannel === 'webhook'" class="form-group full-width">
          <label>Webhook 地址</label>
          <input 
            type="text" 
            v-model="configStore.settings.pushplusWebhook"
            placeholder="https://your-webhook-url.com/notify"
            @blur="saveSettings"
          />
          <small class="help-text">自定义 Webhook 回调地址</small>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.message {
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.success-message {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.features-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feature-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.feature-info h3 {
  margin: 0 0 0.3rem 0;
  color: #333;
}

.feature-info p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.advanced-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.full-width {
  width: 100%;
}

.help-text {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.85rem;
  color: #666;
}
</style>
