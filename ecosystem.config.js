/**
 * PM2 Ecosystem Configuration
 * Deployment to VPS with auto-restart and monitoring
 */

module.exports = {
  apps: [
    {
      name: 'surgix-marketing-bot',
      script: './src/bot.js',
      instances: 1,
      exec_mode: 'fork',
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // Restart policies
      max_memory_restart: '500M',
      max_restarts: 10,
      min_uptime: '10s',
      
      // Logging
      out_file: '/var/log/surgix-bot/out.log',
      error_file: '/var/log/surgix-bot/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart on file changes (dev only)
      watch: false,
      ignore_watch: ['node_modules', 'data', '.git'],
      
      // Monitoring
      kill_timeout: 5000,
      listen_timeout: 3000
    }
  ],
  
  // Deployment config
  deploy: {
    production: {
      user: process.env.VPS_USER || 'root',
      host: process.env.VPS_HOST || '173.249.37.7',
      key: '/Users/apple/.ssh/id_rsa',
      ref: 'origin/main',
      repo: 'https://github.com/your-repo/surgix-marketing-bot.git',
      path: '/app/surgix-marketing-bot',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': 'echo "Deploying to production..."'
    }
  }
};
