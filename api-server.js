#!/usr/bin/env node

const http = require('http')
const fs = require('fs')
const path = require('path')
const taskRunner = require('./task-runner')

const PORT = process.env.PORT || 3001
const CONFIG_FILE = path.join(__dirname, 'config.json')
const LOGS_FILE = path.join(__dirname, 'logs.json')

// 日志
const logs = []
const clients = []
let currentExecutionId = null
let executionLogs = []

// 启动前检查
console.log('\n========================================')
console.log('🔍 启动前检查...')
console.log('========================================')

let hasError = false

// 检查 1: node_modules 是否存在
console.log('\n1️⃣  检查依赖安装...')
const nodeModulesPath = path.join(__dirname, 'node_modules')
if (!fs.existsSync(nodeModulesPath)) {
  console.error('   ❌ node_modules 目录不存在')
  console.error('   💡 请先运行：npm install')
  hasError = true
} else {
  const modules = fs.readdirSync(nodeModulesPath).filter(f => !f.startsWith('.'))
  console.log(`   ✅ node_modules 存在 (${modules.length} 个包)`)
}

// 检查 2: 核心依赖是否存在
console.log('\n2️⃣  检查核心依赖...')
const requiredPackages = ['@neteasecloudmusicapienhanced/api']
requiredPackages.forEach(pkg => {
  const pkgPath = path.join(nodeModulesPath, pkg)
  if (fs.existsSync(pkgPath)) {
    console.log(`   ✅ ${pkg}`)
  } else {
    console.error(`   ❌ ${pkg} 未安装`)
    hasError = true
  }
})

// 检查 3: package.json 是否存在
console.log('\n3️⃣  检查项目配置...')
const packageJsonPath = path.join(__dirname, 'package.json')
if (fs.existsSync(packageJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  console.log(`   ✅ package.json (项目：${pkg.name}, 版本：${pkg.version})`)
} else {
  console.error('   ❌ package.json 不存在')
  hasError = true
}

// 检查 4: config.json 可选文件
console.log('\n4️⃣  检查配置文件...')
if (fs.existsSync(CONFIG_FILE)) {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
    const userCount = config.users ? config.users.length : 0
    console.log(`   ✅ config.json (账号数：${userCount})`)
    if (userCount === 0) {
      console.warn('   ⚠️  当前没有配置账号，请在 Web 界面添加账号')
    }
  } catch (e) {
    console.error('   ❌ config.json 格式错误:', e.message)
  }
} else {
  console.warn('   ⚠️  config.json 不存在 (首次启动会自动创建)')
}

// 检查 5: 日志文件
console.log('\n5️⃣  检查日志文件...')
if (fs.existsSync(LOGS_FILE)) {
  try {
    const logData = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8'))
    console.log(`   ✅ logs.json (历史日志：${logData.length} 条)`)
  } catch (e) {
    console.warn('   ⚠️  logs.json 读取失败，将创建新文件')
  }
} else {
  console.log('   ℹ️  首次启动，将创建 logs.json')
}

// 检查 6: 端口占用（使用同步方式检查）
console.log('\n6️⃣  检查端口占用...')
// 使用同步检查方式，提前捕获可能的端口占用

// 检查结果
console.log('\n========================================')
if (hasError) {
  console.error('❌ 启动检查失败！请修复上述错误后重试')
  console.error('========================================\n')
  process.exit(1)
} else {
  console.log('✅ 所有检查通过！正在启动服务...')
  console.error('========================================\n')
}

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
    } catch (e) { }
  })
}

function saveLogs() {
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2))
  } catch (e) {
    console.error('保存日志文件失败:', e.message)
  }
}

// 加载 API
let API
try {
  API = require('@neteasecloudmusicapienhanced/api')
  console.log('✅ API Enhanced 已加载\n')
} catch (e) {
  console.error('❌ 无法加载 API Enhanced:', e.message)
  process.exit(1)
}

async function executeTaskWithAPI(user, config, executionId, timestamp) {
  const logger = {
    log: (...args) => {
      const message = args.join(' ')
      console.log(message)
      const log = { type: 'info', time: Date.now(), message }
      executionLogs.push(log)
      broadcastLog(log)
    },
    error: (...args) => {
      const message = args.join(' ')
      console.error(message)
      const log = { type: 'error', time: Date.now(), message }
      executionLogs.push(log)
      broadcastLog(log)
    },
    warn: (...args) => {
      const message = args.join(' ')
      console.warn(message)
      const log = { type: 'warn', time: Date.now(), message }
      executionLogs.push(log)
      broadcastLog(log)
    }
  }
  
  const onProgress = (log) => {
    executionLogs.push({ type: log.type, time: Date.now(), message: log.message })
    broadcastLog({ type: log.type, time: Date.now(), message: log.message })
  }
  
  try {
    const result = await taskRunner.executeUserTasks(user, config, { logger, onProgress })
    logs.push(result)
    saveLogs()
    return result
  } catch (error) {
    const errorLog = { type: 'error', time: Date.now(), message: `❌ 账号 ${user.nickname} 执行失败：${error.message}` }
    executionLogs.push(errorLog)
    broadcastLog(errorLog)
    console.error(`❌ 账号 ${user.nickname} 执行失败：${error.message}`)
    throw error
  }
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
  
  if (req.url === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }))
    return
  }
  
  if (req.url === '/api/config' && req.method === 'GET') {
    try {
      if (!fs.existsSync(CONFIG_FILE)) {
        const defaultConfig = { users: [], enableYunbeiSign: true, enableYunbeiSignPC: true, enableVipSign: true, enableVipGrowthpoint: true, showVipTaskList: true, enableVipMusicTasks: true, vipMusicPlaylistId: 8402996200, vipMusicFallbackPlaylistIds: [7785066739, 5453912201], vipMusicSongCount: 4, enableVipMusicScrobble: false, enableAutoPost: true, deletePreviousPost: true, postPlaylistId: 8402996200, postSongCount: 1, serverSendKey: '', pushplusToken: '', pushplusChannel: 'wechat', pushplusWebhook: '' }
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2))
        console.log('创建默认配置文件')
      }
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(config))
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: e.message }))
    }
    return
  }
  
  if (req.url === '/api/execute' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', async () => {
      try {
        const requestData = JSON.parse(body)
        const configData = requestData.config
        
        if (!configData || !configData.users || configData.users.length === 0) {
          throw new Error('请至少配置一个账号')
        }
        
        if (currentExecutionId) {
          res.writeHead(409, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: '已有任务正在执行', executionId: currentExecutionId }))
          return
        }
        
        const executionId = `exec-${Date.now()}`
        currentExecutionId = executionId
        executionLogs = []
        
        console.log(`\n========================================`)
        console.log(`▶️  开始执行任务 (ID: ${executionId})`)
        console.log(`账号数：${configData.users.length}`)
        console.log(`========================================\n`)
        
        const startLog = { type: 'system', time: Date.now(), message: `▶️  开始执行任务 - ${configData.users.length} 个账号` }
        executionLogs.push(startLog)
        broadcastLog(startLog)
        
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true, executionId, message: '任务已开始' }))
        
        for (const user of configData.users) {
          console.log(`\n处理账号：${user.nickname}`)
          console.log(`Cookie: ${user.cookie.substring(0, 20)}...`)
          const log = { type: 'info', time: Date.now(), message: `▶️  处理账号：${user.nickname}` }
          executionLogs.push(log)
          broadcastLog(log)
          
          try {
            await executeTaskWithAPI(user, configData, executionId, Date.now())
          } catch (e) {
            const errorLog = { type: 'error', time: Date.now(), message: `❌ 账号 ${user.nickname} 执行失败：${e.message}` }
            executionLogs.push(errorLog)
            broadcastLog(errorLog)
            console.error(`❌ 账号 ${user.nickname} 执行失败：${e.message}`)
          }
        }
        
        const endLog = { type: 'system', time: Date.now(), message: `⏹️  任务执行完成` }
        executionLogs.push(endLog)
        broadcastLog(endLog)
        console.log(`\n========================================`)
        console.log(`⏹️  所有任务执行完成`)
        console.log(`========================================\n`)
        
        currentExecutionId = null
        
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: e.message }))
        currentExecutionId = null
      }
    })
    return
  }
  
  if (req.url === '/api/logs' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(logs))
    return
  }
  
  if (req.url === '/api/logs/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    })
    
    clients.push(res)
    
    req.on('close', () => {
      const index = clients.indexOf(res)
      if (index > -1) {
        clients.splice(index, 1)
      }
    })
    
    return
  }
  
  if (req.url === '/api/execution-status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ executing: currentExecutionId !== null, executionId: currentExecutionId }))
    return
  }
  
  if (req.url === '/api/save-config' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      try {
        const config = JSON.parse(body)
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
        console.log('配置已保存到 config.json')
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true, message: '配置已保存' }))
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: false, message: e.message }))
      }
    })
    return
  }

  res.writeHead(404)
  res.end('Not Found')
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('\n========================================')
    console.error(`❌ 启动失败：端口 ${PORT} 已被占用`)
    console.error('💡 解决方案:')
    console.error('   1. 关闭占用端口的程序（如 PM2 进程）')
    console.error('   2. 设置 PORT 环境变量使用其他端口：PORT=3002 node api-server.js')
    console.error('   3. 使用 lsof -i :3001 查找占用进程后 kill')
    console.error('========================================\n')
    process.exit(1)
  } else {
    console.error('\n========================================')
    console.error(`❌ 服务器启动失败：${err.message}`)
    console.error('========================================\n')
  }
})

server.listen(PORT, () => {
  console.log('========================================')
  console.log(`🚀 服务已启动！`)
  console.log(`========================================`)
  console.log(`API 服务器：http://localhost:${PORT}`)
  console.log(`健康检查：http://localhost:${PORT}/api/health`)
  console.log(`前端地址：http://localhost:3000`)
  console.log('========================================\n')
})
