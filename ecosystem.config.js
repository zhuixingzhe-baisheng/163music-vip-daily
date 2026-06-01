module.exports = {
  apps: [
    {
      name: 'netease-api-server',
      script: './api-server.js',
      cwd: '.',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/api-server-error.log',
      out_file: './logs/api-server-out.log',
      log_file: './logs/api-server-combined.log',
      time: true
    },
    {
      name: 'netease-frontend',
      script: 'npm',
      cwd: './frontend',
      args: 'run dev',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '../logs/frontend-error.log',
      out_file: '../logs/frontend-out.log',
      log_file: '../logs/frontend-combined.log',
      time: true
    }
  ]
}
