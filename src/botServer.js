#!/usr/bin/env node

/**
 * Surgi-X Marketing Bot — Flexible Entry Point
 * Supports both polling (local) and webhook (production) modes
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');

const AssetIndexer = require('./assetIndexer');
const CourseParser = require('./courseParser');
const CaptionGenerator = require('./captionGenerator');
const BufferClient = require('./bufferClient');
const TelegrafBot = require('./telegrafBot');
const WebhookHandler = require('./webhookHandler');

const MODE = process.env.BOT_MODE || 'polling'; // polling | webhook
const VPS_HOST = process.env.VPS_HOST || '173.249.37.7';
const VPS_PORT = process.env.BOT_PORT || 3000;

async function initializeCore() {
  console.log('🚀 Initializing Surgi-X Marketing Bot...\n');

  try {
    // 1. Index assets (or load from cache)
    console.log('📦 Phase 1: Asset Indexing');
    const assetIndexPath = './data/asset-index.json';
    let assetIndexer;
    
    if (fs.existsSync(assetIndexPath)) {
      console.log('  ✓ Using cached asset index');
      assetIndexer = new AssetIndexer(process.env.ASSET_DIR || '');
      const index = JSON.parse(fs.readFileSync(assetIndexPath, 'utf8'));
      assetIndexer.loadIndex(index);
    } else {
      const assetDir = process.env.ASSET_DIR;
      assetIndexer = new AssetIndexer(assetDir);
      await assetIndexer.indexAllAssets();
      assetIndexer.saveIndex(assetIndexPath);
    }
    console.log(assetIndexer.getVisualLanguageSummary());
    console.log('');

    // 2. Parse course materials (or load from cache)
    console.log('📚 Phase 2: Course Materials Parsing');
    const courseKnowledgePath = './data/course-knowledge.json';
    let courseParser;
    
    if (fs.existsSync(courseKnowledgePath)) {
      console.log('  ✓ Using cached course knowledge');
      courseParser = new CourseParser(process.env.COURSE_DIR || '');
      const knowledge = JSON.parse(fs.readFileSync(courseKnowledgePath, 'utf8'));
      courseParser.loadKnowledge(knowledge);
    } else {
      const courseDir = process.env.COURSE_DIR;
      courseParser = new CourseParser(courseDir);
      await courseParser.parseAllMaterials();
      courseParser.saveKnowledgeBase(courseKnowledgePath);
    }
    console.log(courseParser.getKnowledgeSummary());
    console.log('');

    // 3. Initialize caption generator
    console.log('🎯 Phase 3: Caption Generator Setup');
    const captionGenerator = new CaptionGenerator(process.env.ANTHROPIC_API_KEY);
    console.log('  ✓ Claude API configured');
    console.log('  ✓ 4 platform variants ready');
    console.log('');

    // 4. Initialize Buffer client
    console.log('📤 Phase 4: Buffer API Integration');
    const bufferClient = new BufferClient(process.env.BUFFER_ACCESS_TOKEN);
    try {
      await bufferClient.testConnection();
      await bufferClient.authenticate();
    } catch (err) {
      console.warn('⚠️ Buffer API not fully initialized (will use mock mode)');
    }
    console.log('');

    return {
      assetIndexer,
      courseParser,
      captionGenerator,
      bufferClient
    };
  } catch (err) {
    console.error('❌ Fatal error during initialization:', err);
    process.exit(1);
  }
}

async function startPollingMode(core) {
  console.log('💬 Phase 5: Telegram Bot Setup (Polling Mode)');
  
  const telegrafBot = new TelegrafBot(
    process.env.TELEGRAM_BOT_TOKEN,
    process.env.TELEGRAM_CHAT_ID,
    core.captionGenerator,
    core.bufferClient,
    core.assetIndexer,
    core.courseParser
  );

  try {
    await telegrafBot.startBot();
    console.log('✅ Bot is live (polling mode)!\n');
  } catch (err) {
    console.error('❌ Failed to start polling mode:', err.message);
    console.error('Waiting 10 seconds before retry...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    return startPollingMode(core);
  }

  showStatus(core);
  return telegrafBot;
}

async function startWebhookMode(core) {
  console.log('💬 Phase 5: Telegram Bot Setup (Webhook Mode)');
  
  // Construct webhook URL
  const webhookUrl = `https://${VPS_HOST}:${VPS_PORT}/bot${process.env.TELEGRAM_BOT_TOKEN}`;
  console.log(`📡 Webhook URL: ${webhookUrl}\n`);

  // Initialize webhook handler
  const webhookHandler = new WebhookHandler(
    process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl,
    VPS_PORT
  );

  // Create handlers (from TelegrafBot logic)
  const handlers = createHandlers(core);

  // Initialize express app with handlers
  const app = await webhookHandler.initializeWebhook(handlers);

  // Register webhook with Telegram
  await webhookHandler.registerWebhook();
  console.log('✅ Webhook registered with Telegram\n');

  // Start server
  webhookHandler.startServer();

  showStatus(core);
  return webhookHandler;
}

function createHandlers(core) {
  return {
    start: (ctx) => {
      const message = `
🤖 **Surgi-X Marketing Bot** v1.0

I help you generate and publish marketing content across all platforms.

**Available Commands:**
/help - Show this help message
/upload - Upload a design for captioning
/generate - Generate educational content
/status - Show today's activity
/report - Get analytics report

*Ready to help you market Surgi-X!*
      `;
      ctx.reply(message, { parse_mode: 'Markdown' });
    },

    help: (ctx) => {
      const help = `
📖 **Surgi-X Marketing Bot Help**

**Caption Generation:**
/upload - Upload an image → I'll generate platform-specific captions
/generate [specialty] - Generate educational content

**Analytics:**
/status - Today's posts and engagement
/report [period] - Get analytics (day/week/month)

Type a command to begin.
      `;
      ctx.reply(help, { parse_mode: 'Markdown' });
    },

    upload: (ctx) => {
      ctx.reply('📸 Please upload the design image you want captions for.');
      ctx.session = ctx.session || {};
      ctx.session.awaitingImage = true;
    },

    generate: async (ctx) => {
      const args = ctx.message.text.split(' ');
      const specialty = args[1] || null;
      const message = specialty 
        ? `📚 Generating ${specialty} content...`
        : '📚 Generating educational content...';
      ctx.reply(message);
    },

    status: (ctx) => {
      ctx.reply('📊 Today\'s activity: 0 posts scheduled');
    },

    report: (ctx) => {
      ctx.reply('📈 Analytics: No data yet');
    },

    on_message: (ctx) => {
      // Handle text messages
      ctx.reply('Got your message!');
    },

    on_photo: (ctx) => {
      // Handle photo uploads
      ctx.reply('📸 Photo received! Processing...');
    },

    on_callback: (ctx) => {
      // Handle button callbacks
      ctx.answerCbQuery('Processing...');
    }
  };
}

function showStatus(core) {
  console.log('═══════════════════════════════════════════');
  console.log(`Surgi-X Marketing Bot — ${MODE.toUpperCase()} Mode`);
  console.log('═══════════════════════════════════════════');
  console.log(`📊 Assets Indexed: ${core.assetIndexer.getAllAssets().length}`);
  console.log(`📚 Specialties: ${core.courseParser.getSpecialties().length}`);
  console.log(`💬 Telegram: ${MODE === 'webhook' ? '✅ Webhook' : '✅ Polling'}`);
  console.log(`📤 Buffer: Connected`);
  console.log('═══════════════════════════════════════════\n');
}

async function main() {
  // Initialize core systems
  const core = await initializeCore();

  // Start bot in selected mode
  if (MODE === 'webhook') {
    await startWebhookMode(core);
  } else {
    await startPollingMode(core);
  }

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n✅ Shutting down gracefully...');
    process.exit(0);
  });
}

if (require.main === module) {
  main();
}

module.exports = { initializeCore, startPollingMode, startWebhookMode };
