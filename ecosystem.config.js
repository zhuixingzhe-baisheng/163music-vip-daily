module.exports = {
  apps: [
    {
      name: 'netease-tasks',
      script: './auto_tasks_enhanced.js',
      cwd: '.',
      instances: 1,
      autorestart: false,
      watch: false,
      max_memory_restart: '256M',
      cron_restart: '0 8 * * *', // 每天早上 8:00 执行
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
