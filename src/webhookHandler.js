/**
 * Telegram Webhook Handler for Production Deployment
 * Replaces polling with webhook mode (more efficient, no conflicts)
 */

const express = require('express');
const { Telegraf } = require('telegraf');

class WebhookHandler {
  constructor(botToken, webhookUrl, port = 3000) {
    this.botToken = botToken;
    this.webhookUrl = webhookUrl;
    this.port = port;
    this.bot = new Telegraf(botToken);
    this.app = express();
  }

  /**
   * Initialize webhook mode
   * @param {Object} handlers - Bot command/event handlers
   */
  async initializeWebhook(handlers) {
    // Middleware
    this.app.use(express.json());

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', bot: 'surgi-x-marketing-bot' });
    });

    // Webhook endpoint for Telegram
    this.app.post(`/bot${this.botToken}`, (req, res) => {
      this.bot.handleUpdate(req.body, res);
    });

    // Setup bot handlers
    this._setupHandlers(handlers);

    return this.app;
  }

  /**
   * Register bot command handlers
   */
  _setupHandlers(handlers) {
    if (handlers.start) this.bot.start(handlers.start);
    if (handlers.help) this.bot.command('help', handlers.help);
    if (handlers.upload) this.bot.command('upload', handlers.upload);
    if (handlers.generate) this.bot.command('generate', handlers.generate);
    if (handlers.status) this.bot.command('status', handlers.status);
    if (handlers.report) this.bot.command('report', handlers.report);
    if (handlers.preferences) this.bot.command('preferences', handlers.preferences);
    if (handlers.on_message) this.bot.on('message', handlers.on_message);
    if (handlers.on_photo) this.bot.on('photo', handlers.on_photo);
    if (handlers.on_callback) this.bot.on('callback_query', handlers.on_callback);
  }

  /**
   * Register webhook with Telegram API
   * Must be called once during deployment
   */
  async registerWebhook() {
    try {
      // Remove old webhook if any
      await this.bot.telegram.deleteWebhook({ drop_pending_updates: false });
      
      // Set new webhook
      const result = await this.bot.telegram.setWebhook(this.webhookUrl);
      console.log('✅ Webhook registered:', result);
      return result;
    } catch (err) {
      console.error('❌ Failed to register webhook:', err.message);
      throw err;
    }
  }

  /**
   * Unregister webhook (cleanup)
   */
  async unregisterWebhook() {
    try {
      await this.bot.telegram.deleteWebhook();
      console.log('✅ Webhook unregistered');
    } catch (err) {
      console.error('❌ Failed to unregister webhook:', err.message);
      throw err;
    }
  }

  /**
   * Get webhook status
   */
  async getWebhookInfo() {
    try {
      const info = await this.bot.telegram.getWebhookInfo();
      return info;
    } catch (err) {
      console.error('❌ Failed to get webhook info:', err.message);
      throw err;
    }
  }

  /**
   * Start webhook server
   */
  startServer() {
    this.server = this.app.listen(this.port, () => {
      console.log(`🚀 Webhook server running on port ${this.port}`);
      console.log(`📡 Webhook URL: ${this.webhookUrl}`);
    });
    return this.server;
  }

  /**
   * Stop webhook server
   */
  stopServer() {
    if (this.server) {
      this.server.close();
      console.log('✅ Webhook server stopped');
    }
  }

  /**
   * Get bot instance (for direct API access if needed)
   */
  getBot() {
    return this.bot;
  }
}

module.exports = WebhookHandler;
