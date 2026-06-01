import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useConfigStore = defineStore('config', () => {
  const users = ref([])
  const settings = ref({
    enableYunbeiSign: true,
    enableYunbeiSignPC: true,
    enableVipSign: true,
    enableVipGrowthpoint: true,
    enableVipMusicTasks: true,
    enableAutoPost: true,
    deletePreviousPost: true,
    vipMusicPlaylistId: '8402996200',
    vipMusicSongCount: 3,
    postPlaylistId: '8402996200',
    postSongCount: 1,
    serverSendKey: '',
    pushplusToken: '',
    pushplusChannel: 'wechat'
  })

  const addUser = (user) => {
    users.value.push(user)
  }

  const removeUser = (index) => {
    users.value.splice(index, 1)
  }

  const updateSetting = (key, value) => {
    settings.value[key] = value
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
  }

  return {
    users,
    settings,
    addUser,
    removeUser,
    updateSetting,
    exportConfig,
    importConfig
  }
})
