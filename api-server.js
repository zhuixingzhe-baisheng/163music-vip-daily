const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 3001

const server = http.createServer((req, res) => {
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', message: '前端预览服务运行中' }))
    return
  }

  res.writeHead(404)
  res.end('Not Found')
})

server.listen(PORT, () => {
  console.log(`API 服务器运行在 http://localhost:${PORT}`)
})
