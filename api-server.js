const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 3001

const logs = []

function executeTasks(config) {
  return new Promise((resolve) => {
    const results = []
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    
    console.log('开始执行任务...')
    
    if (!config.users || config.users.length === 0) {
      resolve({ success: false, message: '没有配置任何账号' })
      return
    }
    
    config.users.forEach((user, index) => {
      const userResult = {
        time: timestamp,
        account: user.nickname,
        type: 'success',
        summary: '所有任务执行成功',
        details: []
      }
      
      console.log(`执行账号 ${index + 1}/${config.users.length}: ${user.nickname}`)
      
      if (config.enableYunbeiSign && config.enableYunbeiSign !== false) {
        userResult.details.push('✅ 云贝签到（安卓端）：模拟执行成功 +5 云贝')
      }
      
      if (config.enableYunbeiSignPC && config.enableYunbeiSignPC !== false) {
        userResult.details.push('✅ 云贝签到（PC 端）：模拟执行成功 +5 云贝')
      }
      
      if (config.enableVipSign && config.enableVipSign !== false) {
        userResult.details.push('✅ VIP 乐签打卡：打卡成功')
      }
      
      if (config.enableVipGrowthpoint && config.enableVipGrowthpoint !== false) {
        userResult.details.push('✅ VIP 成长值领取：领取 100 成长值')
      }
      
      if (config.enableVipMusicTasks && config.enableVipMusicTasks !== false) {
        userResult.details.push('✅ VIP 音乐任务：已完成')
      }
      
      if (config.enableAutoPost && config.enableAutoPost !== false) {
        userResult.details.push('✅ 自动发布动态：已发布 1 首歌曲')
      }
      
      results.push(userResult)
    })
    
    logs.unshift(...results.reverse())
    
    while (logs.length > 50) {
      logs.pop()
    }
    
    console.log('任务执行完成')
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
    res.end(JSON.stringify({ status: 'ok', message: '前端预览服务运行中' }))
    return
  }
  
  if (req.url === '/api/logs' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(logs))
    return
  }
  
  if (req.url === '/api/execute' && req.method === 'POST') {
    let body = ''
    
    req.on('data', chunk => {
      body += chunk.toString()
    })
    
    req.on('end', async () => {
      try {
        const config = JSON.parse(body)
        const result = await executeTasks(config)
        
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: false, message: error.message }))
      }
    })
    return
  }
  
  if (req.url === '/api/save-config' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: true }))
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
