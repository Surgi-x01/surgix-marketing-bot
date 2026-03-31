/**
 * Telegram Bot Interface: User interaction layer
 * Commands: /upload, /generate, /schedule, /status, /report
 */

const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

class TelegrafBot {
  constructor(botToken, chatId, captionGenerator, bufferClient, assetIndexer, courseParser) {
    this.bot = new Telegraf(botToken);
    this.chatId = chatId;
    this.captionGenerator = captionGenerator;
    this.bufferClient = bufferClient;
    this.assetIndexer = assetIndexer;
    this.courseParser = courseParser;

    this.sessionData = {
      pendingApproval: {},
      recentPosts: [],
      userPreferences: {
        platforms: ['linkedin', 'instagram', 'meta', 'x'],
        tone: 'professional'
      }
    };

    this._setupHandlers();
  }

  _setupHandlers() {
    // Start command
    this.bot.start((ctx) => {
      const message = `
🤖 **Surgi-X Marketing Bot** v1.0

I help you generate and publish marketing content across all platforms.

**Available Commands:**
/help - Show this help message
/upload - Upload a design for captioning
/generate - Generate educational content
/schedule - Schedule a post for later
/status - Show today's activity
/report - Get analytics report
/preferences - Update bot preferences

*Ready to help you market Surgi-X!*
      `;
      ctx.reply(message, { parse_mode: 'Markdown' });
    });

    this.bot.command('help', (ctx) => {
      const help = `
📖 **Surgi-X Marketing Bot Help**

**Caption Generation:**
/upload - Upload an image → I'll generate platform-specific captions
/generate [specialty] - Generate educational content (e.g., /generate "General Surgery")

**Publishing:**
/schedule [date] [time] - Schedule a post (e.g., /schedule 2026-03-31 09:00)
/post [asset_id] - Post asset immediately

**Analytics:**
/status - Today's posts and engagement
/report [period] - Get analytics (day/week/month)

**Settings:**
/preferences - Configure platforms, tone, scheduling

**Examples:**
/upload - Then attach an image file
/generate bariatric - Generate bariatric surgery content
/schedule 2026-03-31 14:00 - Schedule for March 31 at 2 PM

Type a command to begin.
      `;
      ctx.reply(help, { parse_mode: 'Markdown' });
    });

    // Upload command
    this.bot.command('upload', (ctx) => {
      ctx.reply('📸 Please upload the design image you want captions for.');
      ctx.session = ctx.session || {};
      ctx.session.awaitingImage = true;
    });

    // Generate command
    this.bot.command('generate', async (ctx) => {
      const args = ctx.message.text.split(' ');
      const specialty = args[1] || null;

      const message = specialty 
        ? `📚 Generating ${specialty} content...`
        : '📚 Generating educational content...';
      
      ctx.reply(message);
      
      // Generate sample content
      const context = specialty 
        ? `Educational content about ${specialty}`
        : 'General surgical educational content';
      
      try {
        const captions = await this.captionGenerator.generateCaptions(context);
        this._showCaptionPreview(ctx, captions);
      } catch (err) {
        ctx.reply(`❌ Error generating content: ${err.message}`);
      }
    });

    // Status command
    this.bot.command('status', (ctx) => {
      const status = `
📊 **Today's Status**

Posts Published: ${this.sessionData.recentPosts.length}
Platforms Active: ${this.sessionData.userPreferences.platforms.join(', ')}

Recent Activity:
${this.sessionData.recentPosts.length > 0 
  ? this.sessionData.recentPosts.map(p => `• ${p.platform} - ${p.timestamp}`).join('\n')
  : 'No posts yet today'}

Use /report for detailed analytics.
      `;
      ctx.reply(status, { parse_mode: 'Markdown' });
    });

    // File/image uploads
    this.bot.on('document', this._handleDocumentUpload.bind(this));
    this.bot.on('photo', this._handlePhotoUpload.bind(this));
  }

  async _handlePhotoUpload(ctx) {
    if (!ctx.session?.awaitingImage) {
      ctx.reply('Please use /upload first to process an image.');
      return;
    }

    try {
      ctx.reply('🔄 Processing image...');

      // Get file info
      const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      const file = await ctx.telegram.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${this.bot.token}/${file.file_path}`;

      // Generate captions
      const captions = await this.captionGenerator.generateCaptions('Marketing design asset');
      
      // Show preview and ask for approval
      this._showCaptionPreview(ctx, captions);
      ctx.session.pendingPost = {
        imageUrl: fileUrl,
        captions,
        timestamp: new Date().toISOString()
      };

      ctx.reply('✅ Ready to post? Reply "publish" to post now or "schedule" to schedule for later.');
    } catch (err) {
      ctx.reply(`❌ Error processing image: ${err.message}`);
    } finally {
      ctx.session.awaitingImage = false;
    }
  }

  async _handleDocumentUpload(ctx) {
    // Similar to photo upload but for document files
    ctx.reply('Document uploads: Please use /upload with image files instead.');
  }

  _showCaptionPreview(ctx, captions) {
    const preview = `
✨ **Caption Preview**

📱 **LinkedIn:**
${captions.captions.linkedin}

📷 **Instagram:**
${captions.captions.instagram}

👥 **Meta/Facebook:**
${captions.captions.meta}

𝕏 **X (Twitter):**
${captions.captions.x}

---
Character counts:
• LinkedIn: ${captions.wordCounts.linkedin.characters} chars
• Instagram: ${captions.wordCounts.instagram.characters} chars
• Meta: ${captions.wordCounts.meta.characters} chars
• X: ${captions.wordCounts.x.characters} chars (limit: 280)
    `;
    ctx.reply(preview, { parse_mode: 'Markdown' });
  }

  async startBot() {
    try {
      // Try to remove any existing webhook before starting polling
      try {
        await this.bot.telegram.deleteWebhook({ drop_pending_updates: false });
        console.log('✓ Cleaned up old webhook');
      } catch (webhookErr) {
        // Webhook might not exist, that's fine
        console.log('ℹ️  No webhook to clean up');
      }

      await this.bot.launch();
      console.log('✓ Telegram bot started (polling mode)');
      
      // Graceful shutdown
      process.once('SIGINT', () => this.bot.stop('SIGINT'));
      process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    } catch (err) {
      if (err.code === 409 || err.message?.includes('409') || err.message?.includes('Conflict')) {
        console.error('⚠️  Token conflict detected (409: another bot instance running)');
        console.error('   This usually means:');
        console.error('   1. Old Render/VPS instance still running');
        console.error('   2. Webhook still registered');
        console.error('   Retrying in 5 seconds...');
        
        // Retry after delay
        setTimeout(() => this.startBot(), 5000);
      } else {
        console.error('❌ Failed to start bot:', err);
        throw err;
      }
    }
  }

  async stopBot() {
    await this.bot.stop();
    console.log('✓ Telegram bot stopped');
  }
}

module.exports = TelegrafBot;
