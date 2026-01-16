module.exports = {
  apps: [
    {
      name: 'dashboard-api',
      script: './src/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      error_file: '/var/log/dashboard/api-error.log',
      out_file: '/var/log/dashboard/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],

  deploy: {
    production: {
      user: 'dashboard',
      host: 'dashboard.tgs.ovh',
      ref: 'origin/main',
      repo: 'https://github.com/turiliffiu/dashboard-nodejs.git',
      path: '/home/dashboard/dashboard-nodejs',
      'pre-deploy-local': '',
      'post-deploy':
        'cd backend && npm install && npm run migrate && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
