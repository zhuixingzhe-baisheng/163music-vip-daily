const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 3001
const CONFIG_FILE = path.join(__dirname, 'config.json')
const LOGS_FILE = path.join(__dirname, 'logs.json')

const logs = []
const clients = []
let currentExecutionId = null
let executionLogs = []

// 加载历史日志
try {
  if (fs.existsSync(LOGS_FILE)) {
    const data = fs.readFileSync(LOGS_FILE, 'utf8')
    const parsed = JSON.parse(data)
    logs.push(...parsed)
    console.log(`已加载 ${logs.length} 条历史日志`)
  }
} catch (e) {
  console.error('加载日志文件失败:', e.message)
}

function broadcastLog(log) {
  clients.forEach(client => {
    try {
      client.write(`data: ${JSON.stringify(log)}\n\n`)
    } catch (e) {
    }
  })
}

function saveLogs() {
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2))
  } catch (e) {
    console.error('保存日志文件失败:', e.message)
  }
}

const neteaseAPI = require('@neteasecloudmusicapienhanced/api')

async function executeTaskWithAPI(user, config, executionId, timestamp) {
  const userResult = {
    time: timestamp,
    account: user.nickname,
    type: 'success',
    summary: '任务执行完成',
    details: []
  }
  
  const cookie = user.cookie
  
  // 获取用户信息
  try {
    const userStatus = await neteaseAPI.user_status({ cookie })
    const userData = await userStatus.json()
    if (userData.code === 200 && userData.profile) {
      const nickname = userData.profile.nickname || user.nickname
      const level = userData.profile.level || 0
      const log = {
        type: 'info',
        time: timestamp,
        message: `👤 登录成功：${nickname} (Lv.${level})`
      }
      executionLogs.push(log)
      broadcastLog(log)
      console.log(`  👤 登录成功：${nickname} (Lv.${level})`)
    }
  } catch (e) {
    console.error('获取用户信息失败:', e.message)
  }
  
  // 云贝签到（安卓端）
  if (config.enableYunbeiSign !== false) {
    try {
      const signRes = await neteaseAPI.android_sign({ cookie })
      const signData = await signRes.json()
      if (signData.code === 200 || signData.code === -2) {
        const yunbei = signData.yunbei || 0
        const log = {
          type: 'task',
          time: timestamp,
          message: `✅ 云贝签到（安卓端）：获得 ${yunbei} 云贝`
        }
        executionLogs.push(log)
        broadcastLog(log)
        console.log(`  ✅ 云贝签到（安卓端）：获得 ${yunbei} 云贝`)
        userResult.details.push(`云贝签到（安卓端）：获得 ${yunbei} 云贝`)
      } else if (signData.msg && signData.msg.includes('已经签到')) {
        const log = {
          type: 'task',
          time: timestamp,
          message: `⚠️ 云贝签到（安卓端）：今日已签到`
        }
        executionLogs.push(log)
        broadcastLog(log)
        console.log(`  ⚠️ 云贝签到（安卓端）：今日已签到`)
        userResult.details.push('云贝签到（安卓端）：今日已签到')
      } else {
        throw new Error(signData.msg || '签到失败')
      }
    } catch (e) {
      const log = {
        type: 'error',
        time: timestamp,
        message: `❌ 云贝签到（安卓端）：${e.message}`
      }
      executionLogs.push(log)
      broadcastLog(log)
      console.error(`  ❌ 云贝签到（安卓端）：${e.message}`)
      userResult.details.push(`云贝签到（安卓端）：${e.message}`)
    }
  }
  
  // 云贝签到（PC 端）
  if (config.enableYunbeiSignPC !== false) {
    try {
      const signRes = await neteaseAPI.yunbei_sign({ cookie })
      const signData = await signRes.json()
      if (signData.code === 200 || signData.code === -2) {
        const yunbei = signData.yunbei || 0
        const log = {
          type: 'task',
          time: timestamp,
          message: `✅ 云贝签到（PC 端）：获得 ${yunbei} 云贝`
        }
        executionLogs.push(log)
        broadcastLog(log)
        console.log(`  ✅ 云贝签到（PC 端）：获得 ${yunbei} 云贝`)
        userResult.details.push(`云贝签到（PC 端）：获得 ${yunbei} 云贝`)
      } else if (signData.msg && signData.msg.includes('已经签到')) {
        const log = {
          type: 'task',
          time: timestamp,
          message: `⚠️ 云贝签到（PC 端）：今日已签到`
        }
        executionLogs.push(log)
        broadcastLog(log)
        console.log(`  ⚠️ 云贝签到（PC 端）：今日已签到`)
        userResult.details.push('云贝签到（PC 端）：今日已签到')
      } else {
        throw new Error(signData.msg || '签到失败')
      }
    } catch (e) {
      const log = {
        type: 'error',
        time: timestamp,
        message: `❌ 云贝签到（PC 端）：${e.message}`
      }
      executionLogs.push(log)
      broadcastLog(log)
      console.error(`  ❌ 云贝签到（PC 端）：${e.message}`)
      userResult.details.push(`云贝签到（PC 端）：${e.message}`)
    }
  }
  
  // VIP 乐签打卡
  if (config.enableVipSign !== false) {
    try {
      const vipSignRes = await neteaseAPI.vip_sign({ cookie })
      const vipSignData = await vipSignRes.json()
      if (vipSignData.code === 200) {
        const log = {
          type: 'task',
          time: timestamp,
          message: `✅ VIP 乐签打卡：打卡成功`
        }
        executionLogs.push(log)
        broadcastLog(log)
        console.log(`  ✅ VIP 乐签打卡：打卡成功`)
        userResult.details.push('VIP 乐签打卡：打卡成功')
      } else if (vipSignData.msg && vipSignData.msg.includes('已打卡')) {
        const log = {
          type: 'task',
          time: timestamp,
          message: `⚠️ VIP 乐签打卡：今日已打卡`
        }
        executionLogs.push(log)
        broadcastLog(log)
        console.log(`  ⚠️ VIP 乐签打卡：今日已打卡`)
        userResult.details.push('VIP 乐签打卡：今日已打卡')
      } else {
        const log = {
          type: 'task',
          time: timestamp,
          message: `⚠️ VIP 乐签打卡：${vipSignData.msg || '非 VIP 用户'}`
        }
        executionLogs.push(log)
        broadcastLog(log)
        console.log(`  ⚠️ VIP 乐签打卡：${vipSignData.msg || '非 VIP 用户'}`)
        userResult.details.push(`VIP 乐签打卡：${vipSignData.msg || '非 VIP 用户'}`)
      }
    } catch (e) {
      const log = {
        type: 'error',
        time: timestamp,
        message: `❌ VIP 乐签打卡：${e.message}`
      }
      executionLogs.push(log)
      broadcastLog(log)
      console.error(`  ❌ VIP 乐签打卡：${e.message}`)
      userResult.details.push(`VIP 乐签打卡：${e.message}`)
    }
  }
  
  // VIP 成长值领取
  if (config.enableVipGrowthpoint !== false) {
    try {
      const growthRes = await neteaseAPI.vip_growthpoint_gain({ cookie })
      const growthData = await growthRes.json()
      if (growthData.code === 200) {
        const log = {
          type: 'task',
          time: timestamp,
          message: `✅ VIP 成长值领取：领取成功`
        }
        executionLogs.push(log)
        broadcastLog(log)
        console.log(`  ✅ VIP 成长值领取：领取成功`)
        userResult.details.push('VIP 成长值领取：领取成功')
      } else if (growthData.msg && growthData.msg.includes('可领取')) {
        const log = {
          type: 'task',
          time: timestamp,
          message: `⚠️ VIP 成长值领取：${growthData.msg}`
        }
        executionLogs.push(log)
        broadcastLog(log)
        console.log(`  ⚠️ VIP 成长值领取：${growthData.msg}`)
        userResult.details.push(`VIP 成长值领取：${growthData.msg}`)
      } else {
        const log = {
          type: 'task',
          time: timestamp,
          message: `⚠️ VIP 成长值领取：${growthData.msg || '暂无可领取'}`
        }
        executionLogs.push(log)
        broadcastLog(log)
        console.log(`  ⚠️ VIP 成长值领取：${growthData.msg || '暂无可领取'}`)
        userResult.details.push(`VIP 成长值领取：${growthData.msg || '暂无可领取'}`)
      }
    } catch (e) {
      const log = {
        type: 'error',
        time: timestamp,
        message: `❌ VIP 成长值领取：${e.message}`
      }
      executionLogs.push(log)
      broadcastLog(log)
      console.error(`  ❌ VIP 成长值领取：${e.message}`)
      userResult.details.push(`VIP 成长值领取：${e.message}`)
    }
  }
  
  // VIP 音乐任务
  if (config.enableVipMusicTasks !== false) {
    try {
      const musicTaskRes = await neteaseAPI.vip_timemachine({ cookie })
      const musicTaskData = await musicTaskRes.json()
      if (musicTaskData.code === 200) {
        const log = {
          type: 'task',
          time: timestamp,
          message: `✅ VIP 音乐任务：时空机器执行成功`
        }
        executionLogs.push(log)
        broadcastLog(log)
        console.log(`  ✅ VIP 音乐任务：时空机器执行成功`)
        userResult.details.push('VIP 音乐任务：时空机器执行成功')
      } else {
        const log = {
          type: 'task',
          time: timestamp,
          message: `⚠️ VIP 音乐任务：${musicTaskData.msg || '执行完成'}`
        }
        executionLogs.push(log)
        broadcastLog(log)
        console.log(`  ⚠️ VIP 音乐任务：${musicTaskData.msg || '执行完成'}`)
        userResult.details.push(`VIP 音乐任务：${musicTaskData.msg || '执行完成'}`)
      }
    } catch (e) {
      const log = {
        type: 'error',
        time: timestamp,
        message: `❌ VIP 音乐任务：${e.message}`
      }
      executionLogs.push(log)
      broadcastLog(log)
      console.error(`  ❌ VIP 音乐任务：${e.message}`)
      userResult.details.push(`VIP 音乐任务：${e.message}`)
    }
  }
  
  // 自动发布动态
  if (config.enableAutoPost !== false) {
    try {
      const postRes = await neteaseAPI.event({ 
        cookie,
        pid: config.postPlaylistId || '8402996200'
      })
      const postData = await postRes.json()
      if (postData.code === 200) {
        const log = {
          type: 'task',
          time: timestamp,
          message: `✅ 自动发布动态：发布成功`
        }
        executionLogs.push(log)
        broadcastLog(log)
        console.log(`  ✅ 自动发布动态：发布成功`)
        userResult.details.push('自动发布动态：发布成功')
      } else {
        const log = {
          type: 'task',
          time: timestamp,
          message: `⚠️ 自动发布动态：${postData.msg || '执行完成'}`
        }
        executionLogs.push(log)
        broadcastLog(log)
        console.log(`  ⚠️ 自动发布动态：${postData.msg || '执行完成'}`)
        userResult.details.push(`自动发布动态：${postData.msg || '执行完成'}`)
      }
    } catch (e) {
      const log = {
        type: 'error',
        time: timestamp,
        message: `❌ 自动发布动态：${e.message}`
      }
      executionLogs.push(log)
      broadcastLog(log)
      console.error(`  ❌ 自动发布动态：${e.message}`)
      userResult.details.push(`自动发布动态：${e.message}`)
    }
  }
  
  // 更新摘要
  const errorCount = userResult.details.filter(d => d.includes('❌') || d.includes('失败') || d.includes('错误')).length
  if (errorCount > 0) {
    userResult.type = 'warning'
    userResult.summary = `执行完成，${errorCount} 项失败`
  }
  
  return userResult
}
    
async function executeTasks(config, executionId) {
  const results = []
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
  
  console.log('执行任务函数收到 config.users:', config.users)
  console.log('账号数量:', config.users ? config.users.length : 0)
  
  const startLog = {
    type: 'start',
    time: timestamp,
    message: '🚀 开始执行任务...'
  }
  executionLogs.push(startLog)
  broadcastLog(startLog)
  console.log('开始执行任务...')
  
  if (!config.users || config.users.length === 0) {
    const errorLog = {
      type: 'error',
      time: timestamp,
      message: '❌ 没有配置任何账号，请先在"账号配置"页面添加账号'
    }
    executionLogs.push(errorLog)
    broadcastLog(errorLog)
    console.log('错误：没有配置任何账号')
    
    const helpLog = {
      type: 'info',
      time: timestamp,
      message: '💡 操作步骤：1. 点击"账号配置" → 2. 添加账号 → 3. 填写 MUSIC_U Cookie → 4. 返回首页执行任务'
    }
    executionLogs.push(helpLog)
    broadcastLog(helpLog)
    
    return { success: false, message: '没有配置任何账号' }
  }
  
  for (let i = 0; i < config.users.length; i++) {
    const user = config.users[i]
    const startAccountLog = {
      type: 'info',
      time: timestamp,
      message: `👤 开始执行账号 ${i + 1}/${config.users.length}: ${user.nickname}`
    }
    executionLogs.push(startAccountLog)
    broadcastLog(startAccountLog)
    console.log(`执行账号 ${i + 1}/${config.users.length}: ${user.nickname}`)
    
    try {
      const userResult = await executeTaskWithAPI(user, config, executionId, timestamp)
      results.push(userResult)
    } catch (e) {
      console.error(`账号 ${user.nickname} 执行出错:`, e.message)
      const errorResult = {
        time: timestamp,
        account: user.nickname,
        type: 'error',
        summary: '执行失败',
        details: [`错误：${e.message}`]
      }
      results.push(errorResult)
    }
  }
  
  logs.unshift(...results)
  while (logs.length > 50) {
    logs.pop()
  }
  saveLogs()
  
  const endLog = {
    type: 'complete',
    time: timestamp,
    message: `✨ 任务执行完成，共执行 ${config.users.length} 个账号`
  }
  executionLogs.push(endLog)
  broadcastLog(endLog)
  console.log('任务执行完成')
  
  currentExecutionId = null
  
  return { success: true, message: '任务执行成功' }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }
  
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', message: '前端预览服务运行中', executing: currentExecutionId !== null }))
    return
  }
  
  if (req.url === '/api/logs' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(logs))
    return
  }
  
  if (req.url === '/api/realtime-logs' && req.method === 'GET') {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    
    const sendHeartbeat = setInterval(() => {
      res.write(': heartbeat\n\n')
    }, 30000)
    
    clients.push(res)
    
    executionLogs.forEach(log => {
      res.write(`data: ${JSON.stringify(log)}\n\n`)
    })
    
    res.on('close', () => {
      const index = clients.indexOf(res)
      if (index > -1) {
        clients.splice(index, 1)
      }
      clearInterval(sendHeartbeat)
    })
    
    return
  }

  if (req.url === '/api/execute' && req.method === 'POST') {
    if (currentExecutionId) {
      res.writeHead(409, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, message: '已有任务正在执行中' }))
      return
    }
    
    currentExecutionId = new Date().getTime().toString()
    executionLogs = []
    
    let body = ''
    
    req.on('data', chunk => {
      body += chunk.toString()
    })
    
    req.on('end', async () => {
      try {
        const requestData = JSON.parse(body)
        // 前端发送的格式是 { config: {...} }，所以需要解包
        const config = requestData.config || requestData
        
        console.log('收到执行请求，完整数据:', JSON.stringify(requestData, null, 2))
        console.log('解包后的配置:', JSON.stringify(config, null, 2))
        
        const result = await executeTasks(config, currentExecutionId)
        
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
      } catch (error) {
        currentExecutionId = null
        console.error('执行出错:', error)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: false, message: error.message }))
      }
    })
    return
  }
  
  if (req.url === '/api/stop' && req.method === 'POST') {
    if (currentExecutionId) {
      const stopLog = {
        type: 'stopped',
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        message: '⏹️ 任务已停止'
      }
      executionLogs.push(stopLog)
      broadcastLog(stopLog)
      currentExecutionId = null
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: true, message: '已停止执行' }))
    return
  }
  
  if (req.url === '/api/execution-status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ executing: currentExecutionId !== null, executionId: currentExecutionId }))
    return
  }

  res.writeHead(404)
  res.end('Not Found')
})

server.listen(PORT, () => {
  console.log(`API 服务器运行在 http://localhost:${PORT}`)
  console.log(`健康检查：http://localhost:${PORT}/api/health`)
  console.log(`执行接口：POST http://localhost:${PORT}/api/execute`)
})
