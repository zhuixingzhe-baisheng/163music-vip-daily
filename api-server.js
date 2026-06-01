const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 3001

const logs = []
const clients = []
let currentExecutionId = null
let executionLogs = []

function broadcastLog(log) {
  clients.forEach(client => {
    try {
      client.write(`data: ${JSON.stringify(log)}\n\n`)
    } catch (e) {
    }
  })
}

function executeTasks(config, executionId) {
  return new Promise((resolve) => {
    const results = []
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    
    console.log('收到执行请求，配置数据:', JSON.stringify(config, null, 2))
    console.log('账号列表:', config.users)
    
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
      
      resolve({ success: false, message: '没有配置任何账号' })
      return
    }
    
    config.users.forEach((user, index) => {
      const startAccountLog = {
        type: 'info',
        time: timestamp,
        message: `👤 执行账号 ${index + 1}/${config.users.length}: ${user.nickname}`
      }
      executionLogs.push(startAccountLog)
      broadcastLog(startAccountLog)
      console.log(`执行账号 ${index + 1}/${config.users.length}: ${user.nickname}`)
      
      const userResult = {
        time: timestamp,
        account: user.nickname,
        type: 'success',
        summary: '所有任务执行成功',
        details: []
      }
      
      const tasks = [
        {
          enable: config.enableYunbeiSign,
          name: '云贝签到（安卓端）',
          success: '模拟执行成功 +5 云贝',
          fail: '执行失败'
        },
        {
          enable: config.enableYunbeiSignPC,
          name: '云贝签到（PC 端）',
          success: '模拟执行成功 +5 云贝',
          fail: '执行失败'
        },
        {
          enable: config.enableVipSign,
          name: 'VIP 乐签打卡',
          success: '打卡成功',
          fail: '执行失败'
        },
        {
          enable: config.enableVipGrowthpoint,
          name: 'VIP 成长值领取',
          success: '领取 100 成长值',
          fail: '执行失败'
        },
        {
          enable: config.enableVipMusicTasks,
          name: 'VIP 音乐任务',
          success: '已完成',
          fail: '执行失败'
        },
        {
          enable: config.enableAutoPost,
          name: '自动发布动态',
          success: '已发布 1 首歌曲',
          fail: '执行失败'
        }
      ]
      
      tasks.forEach(task => {
        if (task.enable !== false) {
          const taskLog = {
            type: 'task',
            time: timestamp,
            message: `✅ ${task.name}: ${task.success}`
          }
          executionLogs.push(taskLog)
          broadcastLog(taskLog)
          console.log(`  ✅ ${task.name}: ${task.success}`)
          userResult.details.push(task.success)
        }
      })
      
      results.push(userResult)
    })
    
    logs.unshift(...results.reverse())
    while (logs.length > 50) {
      logs.pop()
    }
    
    const endLog = {
      type: 'complete',
      time: timestamp,
      message: '✨ 任务执行完成'
    }
    executionLogs.push(endLog)
    broadcastLog(endLog)
    console.log('任务执行完成')
    
    currentExecutionId = null

    resolve({ success: true, message: '任务执行成功' })
  })
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
        const config = JSON.parse(body)
        const result = await executeTasks(config, currentExecutionId)
        
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
      } catch (error) {
        currentExecutionId = null
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
