<script setup>
import { useConfigStore } from '../stores/config'

const configStore = useConfigStore()

const features = [
  { key: 'enableYunbeiSign', label: '云贝签到（安卓端）', description: '每日自动进行安卓端云贝签到' },
  { key: 'enableYunbeiSignPC', label: '云贝签到（PC 端）', description: '每日自动进行 PC 端云贝签到' },
  { key: 'enableVipSign', label: 'VIP 乐签打卡', description: 'VIP 用户每日乐签打卡' },
  { key: 'enableVipGrowthpoint', label: 'VIP 成长值领取', description: '自动领取已完成任务的成长值' },
  { key: 'enableVipMusicTasks', label: 'VIP 音乐任务', description: '自动完成收藏、听歌等任务' },
  { key: 'enableAutoPost', label: '自动发布动态', description: '每日自动分享歌曲到动态' },
  { key: 'deletePreviousPost', label: '删除上次动态', description: '发布新动态前删除之前的动态' }
]

const updateSetting = (key, value) => {
  configStore.updateSetting(key, value)
}
</script>

<template>
  <div class="tasks-view">
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
          />
        </div>
        <div class="form-group">
          <label>处理歌曲数量</label>
          <input 
            type="number" 
            v-model.number="configStore.settings.vipMusicSongCount"
            min="1"
            max="10"
          />
        </div>
        <div class="form-group">
          <label>发布动态歌单 ID</label>
          <input 
            type="text" 
            v-model="configStore.settings.postPlaylistId"
            placeholder="8402996200"
          />
        </div>
        <div class="form-group">
          <label>每次发布歌曲数</label>
          <input 
            type="number" 
            v-model.number="configStore.settings.postSongCount"
            min="1"
            max="3"
          />
        </div>
      </div>
    </div>

    <div class="card">
      <h2>消息推送配置</h2>
      <div class="advanced-settings">
        <div class="form-group">
          <label>Server 酱 SendKey</label>
          <input 
            type="text" 
            v-model="configStore.settings.serverSendKey"
            placeholder="SCTxxxxxxxx"
          />
        </div>
        <div class="form-group">
          <label>PushPlus Token</label>
          <input 
            type="text" 
            v-model="configStore.settings.pushplusToken"
            placeholder="你的 token"
          />
        </div>
        <div class="form-group">
          <label>PushPlus 推送渠道</label>
          <select v-model="configStore.settings.pushplusChannel">
            <option value="wechat">微信公众号</option>
            <option value="wechatcp">企业微信</option>
            <option value="corp">企业微信</option>
            <option value="webhook">Webhook</option>
            <option value="sms">短信</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tasks-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}
</style>
