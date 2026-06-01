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
      time: true,
      merge_logs: true
    }
  ]
}
