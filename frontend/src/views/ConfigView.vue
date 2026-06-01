<script setup>
import { ref, onMounted } from 'vue'
import { useConfigStore } from '../stores/config'

const configStore = useConfigStore()

const newNickname = ref('')
const newCookie = ref('')
const showAddForm = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

onMounted(() => {
  console.log('账号配置页面加载，当前账号列表:', configStore.users)
})

const clearMessages = () => {
  setTimeout(() => {
    errorMsg.value = ''
    successMsg.value = ''
  }, 3000)
}

const addNewUser = () => {
  errorMsg.value = ''
  successMsg.value = ''
  
  if (!newNickname.value || newNickname.value.trim() === '') {
    errorMsg.value = '请输入账号昵称'
    clearMessages()
    return
  }
  
  if (!newCookie.value || newCookie.value.trim() === '') {
    errorMsg.value = '请输入 MUSIC_U Cookie'
    clearMessages()
    return
  }
  
  const cookieValue = newCookie.value.startsWith('MUSIC_U=') ? newCookie.value.substring(8) : newCookie.value
  if (!configStore.validateMusicU(cookieValue)) {
    errorMsg.value = 'MUSIC_U 格式不正确，请检查 cookie 值是否有效'
    clearMessages()
    return
  }
  
  const nickname = newNickname.value.trim()
  const cookie = newCookie.value.trim().startsWith('MUSIC_U=') ? newCookie.value.trim() : `MUSIC_U=${newCookie.value.trim()}`
  
  configStore.addUser({
    nickname: nickname,
    cookie: cookie
  })
  
  console.log('账号添加成功:', nickname)
  console.log('当前账号列表:', configStore.users)
  
  successMsg.value = `账号"${nickname}"添加成功！`
  newNickname.value = ''
  newCookie.value = ''
  showAddForm.value = false
  clearMessages()
}

const removeUser = (index) => {
  if (confirm(`确定要删除账号"${configStore.users[index].nickname}"吗？`)) {
    configStore.removeUser(index)
    successMsg.value = '账号已删除'
    clearMessages()
  }
}

const exportConfig = () => {
  const config = configStore.exportConfig()
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'netease-config.json'
  a.click()
  URL.revokeObjectURL(url)
  successMsg.value = '配置导出成功！'
  clearMessages()
}

const importConfigFile = (event) => {
  errorMsg.value = ''
  successMsg.value = ''
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result)
        configStore.importConfig(config)
        successMsg.value = '配置导入成功！'
      } catch (err) {
        errorMsg.value = '配置文件格式错误，请检查文件内容'
      }
      clearMessages()
    }
    reader.onerror = () => {
      errorMsg.value = '文件读取失败'
      clearMessages()
    }
    reader.readAsText(file)
  }
}
</script>

<template>
  <div class="config-view">
    <div v-if="errorMsg" class="message error-message">{{ errorMsg }}</div>
    <div v-if="successMsg" class="message success-message">{{ successMsg }}</div>
    
    <div class="card">
      <h2>多账号管理</h2>
      
      <div class="account-summary">
        <span class="summary-badge">已配置 {{ configStore.users.length }} 个账号</span>
        <button class="btn btn-primary btn-sm" @click="showAddForm = !showAddForm">
          {{ showAddForm ? '取消添加' : '+ 添加账号' }}
        </button>
      </div>
      
      <div v-if="configStore.users.length === 0 && !showAddForm" class="empty-state">
        <p>还没有添加任何账号</p>
        <button class="btn btn-primary" @click="showAddForm = true">添加第一个账号</button>
      </div>

      <div v-else-if="showAddForm" class="add-form">
        <div class="form-group">
          <label>账号昵称 <span class="required">*</span></label>
          <input v-model="newNickname" placeholder="例如：我的主账号" />
        </div>
        <div class="form-group">
          <label>MUSIC_U Cookie <span class="required">*</span></label>
          <textarea v-model="newCookie" placeholder="MUSIC_U=xxxxxxxxxxxxx" rows="3"></textarea>
          <small class="help-text">从浏览器开发者工具复制的 MUSIC_U 值</small>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" @click="addNewUser">添加账号</button>
          <button class="btn btn-secondary" @click="showAddForm = false">取消</button>
        </div>
      </div>

      <div v-else class="users-list">
        <div v-for="(user, index) in configStore.users" :key="index" class="user-card">
          <div class="user-info">
            <div class="user-nickname">{{ user.nickname }}</div>
            <div class="user-cookie">{{ user.cookie.substring(0, 20) }}...</div>
          </div>
          <button class="btn btn-secondary" @click="removeUser(index)">删除</button>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>配置导入导出</h2>
      <div class="config-actions">
        <button class="btn btn-primary" @click="exportConfig">导出配置</button>
        <label class="btn btn-secondary">
          导入配置
          <input type="file" accept=".json" @change="importConfigFile" style="display: none" />
        </label>
      </div>
    </div>

    <div class="card">
      <h2>如何获取 Cookie</h2>
      <div class="help-steps">
        <div class="step">
          <span class="step-number">1</span>
          <div>
            <strong>访问网易云音乐</strong>
            <p>打开浏览器访问 <a href="https://music.163.com" target="_blank">https://music.163.com</a> 并登录</p>
          </div>
        </div>
        <div class="step">
          <span class="step-number">2</span>
          <div>
            <strong>打开开发者工具</strong>
            <p>按 F12 打开开发者工具，进入 <strong>Application</strong> → <strong>Cookies</strong> → <strong>https://music.163.com</strong></p>
          </div>
        </div>
        <div class="step">
          <span class="step-number">3</span>
          <div>
            <strong>复制 MUSIC_U</strong>
            <p>找到名为 <code>MUSIC_U</code> 的 Cookie，复制它的值</p>
          </div>
        </div>
        <div class="step">
          <span class="step-number">4</span>
          <div>
            <strong>填入配置</strong>
            <p>将复制的值填入上方输入框（可以带或不带 <code>MUSIC_U=</code> 前缀）</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.account-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f0f0f0;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.summary-badge {
  font-weight: 600;
  color: #333;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.9rem;
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

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.empty-state p {
  margin-bottom: 1rem;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #e60026;
}

.user-nickname {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.3rem;
}

.user-cookie {
  font-size: 0.85rem;
  color: #999;
  font-family: monospace;
}

.add-form {
  margin-top: 1rem;
  padding: 1.5rem;
  border: 2px dashed #e60026;
  border-radius: 8px;
  background: #fffbfb;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.config-actions {
  display: flex;
  gap: 1rem;
}

.help-steps {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.step {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #e60026;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  flex-shrink: 0;
}

.step strong {
  display: block;
  margin-bottom: 0.3rem;
  color: #333;
}

.step p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.step a {
  color: #e60026;
}

.step code {
  background: #f0f0f0;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: monospace;
  color: #d63384;
}

.required {
  color: #e60026;
}

.help-text {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.85rem;
  color: #666;
}
</style>
