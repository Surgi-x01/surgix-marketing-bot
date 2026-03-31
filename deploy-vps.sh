#!/bin/bash

# Surgi-X Marketing Bot — VPS Deployment Script
# Deploys bot to production with webhook mode

set -e

# Configuration
VPS_HOST="${VPS_HOST:-173.249.37.7}"
VPS_USER="${VPS_USER:-root}"
VPS_PATH="/opt/surgix-marketing-bot"
BOT_PORT="${BOT_PORT:-3000}"

echo "🚀 Deploying Surgi-X Marketing Bot to VPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 VPS: ${VPS_HOST}"
echo "📂 Path: ${VPS_PATH}"
echo "🔌 Port: ${BOT_PORT}"
echo ""

# Step 1: Upload files to VPS
echo "📤 Uploading files..."
ssh ${VPS_USER}@${VPS_HOST} "mkdir -p ${VPS_PATH}"

# Copy bot code
scp -r ./src ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/
scp -r ./data ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/ 2>/dev/null || true
scp ./package.json ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/
scp ./package-lock.json ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/ 2>/dev/null || true
scp ./.env.surgix-bot ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/.env
scp ./ecosystem.config.js ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/

echo "✅ Files uploaded"
echo ""

# Step 2: Install dependencies on VPS
echo "📦 Installing dependencies on VPS..."
ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PATH} && npm install --production"

echo "✅ Dependencies installed"
echo ""

# Step 3: Configure environment on VPS
echo "⚙️  Configuring environment..."
ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PATH} && cat > .env.vps << 'EOF'
BOT_MODE=webhook
BOT_PORT=${BOT_PORT}
VPS_HOST=${VPS_HOST}
$(cat .env | grep -E '^(TELEGRAM_|ANTHROPIC_|BUFFER_|ASSET_|COURSE_|FIGMA_)')
EOF
"

echo "✅ Environment configured"
echo ""

# Step 4: Setup PM2
echo "🔄 Setting up PM2..."
ssh ${VPS_USER}@${VPS_HOST} "
  cd ${VPS_PATH}
  pm2 delete surgix-bot 2>/dev/null || true
  pm2 start src/botServer.js --name surgix-bot --env .env.vps
  pm2 save
  pm2 startup systemd -u ${VPS_USER} --hp /root
"

echo "✅ PM2 configured"
echo ""

# Step 5: Verify deployment
echo "🔍 Verifying deployment..."
sleep 2
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://${VPS_HOST}:${BOT_PORT}/health 2>/dev/null || echo "000")

if [ "$RESPONSE" = "200" ]; then
  echo "✅ Bot is running and healthy!"
else
  echo "⚠️  Could not verify bot status (HTTP ${RESPONSE})"
  echo "   Check: ssh ${VPS_USER}@${VPS_HOST} 'cd ${VPS_PATH} && pm2 logs surgix-bot'"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ Deployment Complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🔗 Bot is live at:"
echo "   Webhook: https://${VPS_HOST}:${BOT_PORT}/bot<TOKEN>"
echo "   Health:  http://${VPS_HOST}:${BOT_PORT}/health"
echo ""
echo "📋 Management:"
echo "   Logs:    ssh ${VPS_USER}@${VPS_HOST} 'cd ${VPS_PATH} && pm2 logs surgix-bot'"
echo "   Status:  ssh ${VPS_USER}@${VPS_HOST} 'pm2 status'"
echo "   Restart: ssh ${VPS_USER}@${VPS_HOST} 'pm2 restart surgix-bot'"
echo ""
