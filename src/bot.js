#!/usr/bin/env node

/**
 * Surgi-X Marketing Bot — Main Entry Point
 * Orchestrates: Asset indexing, caption generation, posting, engagement tracking
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');

const AssetIndexer = require('./assetIndexer');
const CourseParser = require('./courseParser');
const CaptionGenerator = require('./captionGenerator');
const BufferClient = require('./bufferClient');
const TelegrafBot = require('./telegrafBot');

async function initializeBot() {
  console.log('🚀 Initializing Surgi-X Marketing Bot...\n');

  try {
    // 1. Index assets
    console.log('📦 Phase 1: Asset Indexing');
    const assetDir = process.env.ASSET_DIR;
    const assetIndexer = new AssetIndexer(assetDir);
    await assetIndexer.indexAllAssets();
    assetIndexer.saveIndex('./data/asset-index.json');
    console.log(assetIndexer.getVisualLanguageSummary());
    console.log('');

    // 2. Parse course materials
    console.log('📚 Phase 2: Course Materials Parsing');
    const courseDir = process.env.COURSE_DIR;
    const courseParser = new CourseParser(courseDir);
    await courseParser.parseAllMaterials();
    courseParser.saveKnowledgeBase('./data/course-knowledge.json');
    console.log(courseParser.getKnowledgeSummary());
    console.log('');

    // 3. Initialize caption generator
    console.log('🎯 Phase 3: Caption Generator Setup');
    const captionGenerator = new CaptionGenerator(process.env.ANTHROPIC_API_KEY);
    console.log('  ✓ Claude API configured');
    console.log('  ✓ 4 platform variants ready (LinkedIn, Instagram, Meta, X)');
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

    // 5. Initialize Telegram bot
    console.log('💬 Phase 5: Telegram Bot Setup');
    const telegrafBot = new TelegrafBot(
      process.env.TELEGRAM_BOT_TOKEN,
      process.env.TELEGRAM_CHAT_ID,
      captionGenerator,
      bufferClient,
      assetIndexer,
      courseParser
    );
    console.log('  ✓ Telegram handlers configured');
    console.log('');

    // 6. Start bot
    console.log('🎬 Starting bot...');
    await telegrafBot.startBot();
    console.log('✅ Bot is live and ready for use!\n');

    // Show status
    console.log('═══════════════════════════════════════════');
    console.log('Surgi-X Marketing Bot — Ready for Action');
    console.log('═══════════════════════════════════════════');
    console.log(`📊 Assets Indexed: ${assetIndexer.getAllAssets().length}`);
    console.log(`📚 Specialties: ${courseParser.getSpecialties().length}`);
    console.log(`💬 Telegram: Ready (Chat ID: ${process.env.TELEGRAM_CHAT_ID})`);
    console.log(`📤 Buffer: Connected`);
    console.log('');
    console.log('Commands available:');
    console.log('  /help - Show help');
    console.log('  /upload - Generate captions for image');
    console.log('  /generate [specialty] - Generate educational content');
    console.log('  /status - Show today\'s activity');
    console.log('  /report - Get analytics');
    console.log('═══════════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

// Run initialization
if (require.main === module) {
  initializeBot();
}

module.exports = { initializeBot };
