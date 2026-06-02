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
    },
    {
      name: 'netease-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      merge_logs: true
    },
    {
      name: 'netease-tasks',
      script: './auto_tasks_enhanced.js',
      cwd: '.',
      instances: 1,
      autorestart: false,
      watch: false,
      max_memory_restart: '256M',
      cron_restart: '0 8 * * *',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/tasks-error.log',
      out_file: './logs/tasks-out.log',
      log_file: './logs/tasks-combined.log',
      time: true,
      merge_logs: true,
      node_args: '--max-old-space-size=256'
    }
  ]
}
