import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useConfigStore = defineStore('config', () => {
  const STORAGE_KEY = 'netease_tasks_config'
  
  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error('加载本地配置失败:', e)
    }
    return null
  }
  
  const getStorage = () => {
    return localStorage.getItem(STORAGE_KEY)
  }
  
  const saveToStorage = () => {
    try {
      const config = exportConfig()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
      
      // 同时保存到后端 config.json
      fetch('/api/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      }).catch(e => console.error('保存配置到文件失败:', e))
      
      return true
    } catch (e) {
      console.error('保存配置失败:', e)
      return false
    }
  }

  const users = ref([])
  const settings = ref({
    enableYunbeiSign: true,
    enableYunbeiSignPC: true,
    enableVipSign: true,
    enableVipGrowthpoint: true,
    showVipTaskList: true,
    enableVipMusicTasks: true,
    vipMusicPlaylistId: '8402996200',
    vipMusicFallbackPlaylistIds: '7785066739,5453912201',
    vipMusicSongCount: 4,
    enableVipMusicScrobble: false,
    enableAutoPost: true,
    deletePreviousPost: true,
    postPlaylistId: '8402996200',
    postSongCount: 1,
    serverSendKey: '',
    pushplusToken: '',
    pushplusChannel: 'wechat',
    pushplusWebhook: ''
  })

  const savedData = loadFromStorage()
  if (savedData) {
    if (savedData.users) {
      users.value = savedData.users
    }
    Object.keys(savedData).forEach(key => {
      if (key !== 'users' && settings.value.hasOwnProperty(key)) {
        settings.value[key] = savedData[key]
      }
    })
  }

  watch([users, settings], () => {
    saveToStorage()
  }, { deep: true })

  const addUser = (user) => {
    users.value.push(user)
    saveToStorage()
  }

  const removeUser = (index) => {
    users.value.splice(index, 1)
    saveToStorage()
  }

  const updateSetting = (key, value) => {
    settings.value[key] = value
    saveToStorage()
  }

  const exportConfig = () => {
    return {
      users: users.value,
      ...settings.value
    }
  }

  const importConfig = (config) => {
    if (config.users) {
      users.value = config.users
    }
    Object.keys(config).forEach(key => {
      if (key !== 'users' && settings.value.hasOwnProperty(key)) {
        settings.value[key] = config[key]
      }
    })
    saveToStorage()
  }
  
  const validateMusicU = (cookie) => {
    const value = cookie.startsWith('MUSIC_U=') ? cookie.substring(8) : cookie
    return value && value.length > 0 && /^[a-zA-Z0-9_%\-]+$/.test(value)
  }
  
  const validateServerSendKey = (key) => {
    if (!key || key.trim() === '') return true
    return key.startsWith('SCT') && key.length >= 10
  }
  
  const validatePushplusToken = (token) => {
    if (!token || token.trim() === '') return true
    return token.length >= 10
  }

  return {
    users,
    settings,
    addUser,
    removeUser,
    updateSetting,
    exportConfig,
    importConfig,
    validateMusicU,
    validateServerSendKey,
    validatePushplusToken
  }
})
