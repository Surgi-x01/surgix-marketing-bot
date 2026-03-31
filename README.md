# Surgi-X Marketing Bot — Phase 1

**Autonomous marketing content generation and publishing for Surgi-X across LinkedIn, Instagram, Meta, and X.**

## Overview

This bot replaces a marketing lead role by:
- 📸 Analyzing 33 design assets and learning visual language
- 📚 Parsing 10 surgical specialties (course materials)
- ✍️ Generating platform-specific captions (Claude API)
- 📤 Publishing to Buffer (schedules across 4 platforms)
- 📊 Tracking engagement and analytics

**Status:** Phase 1 (Core functionality)

## Architecture

```
┌──────────────────────────────────────────────────────┐
│           Telegram Bot Interface                     │
│  /upload /generate /schedule /status /report         │
└────────────────────┬─────────────────────────────────┘
                     │
        ┌────────────┴──────────────┐
        ▼                           ▼
   Caption Generator          Buffer Client
   (Claude API)               (Publishing)
        │                           │
        └────────────┬──────────────┘
                     ▼
      ┌─────────────────────────┐
      │   Asset & Knowledge     │
      │   • 33 PNG designs      │
      │   • 10 Specialties      │
      │   • Topics & Keywords   │
      └─────────────────────────┘
```

## Installation

### Prerequisites
- Node.js 16+ 
- npm or pnpm
- Telegram bot token
- Claude API key
- Buffer API token
- Anthropic API credentials

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Index assets and parse materials:**
   ```bash
   node src/scripts/indexAssets.js
   node src/scripts/parseMaterials.js
   ```

4. **Start the bot:**
   ```bash
   npm start
   ```

## Usage

### Telegram Commands

#### `/upload`
Upload a design image to get platform-specific captions.

```
User: /upload
Bot: 📸 Please upload the design image
User: [attach image]
Bot: [Shows captions for all 4 platforms]
```

#### `/generate [specialty]`
Generate educational content for a specialty.

```
/generate bariatric
/generate "General Surgery"
/generate  # generates general content
```

#### `/schedule [date] [time]`
Schedule a post for later publishing.

```
/schedule 2026-03-31 14:00
```

#### `/status`
Show today's activity and posts.

```
/status
# Shows: posts published, engagement, recent activity
```

#### `/report [period]`
Get analytics for day/week/month.

```
/report week
```

#### `/preferences`
Configure bot behavior.

```
/preferences
# Set: platforms, tone, scheduling preferences
```

## Development

### Project Structure

```
surgix-marketing-bot/
├── src/
│   ├── bot.js                  # Main entry point
│   ├── assetIndexer.js         # PNG analysis & visual language
│   ├── courseParser.js         # Course material extraction
│   ├── captionGenerator.js     # Claude API wrapper
│   ├── bufferClient.js         # Buffer API integration
│   └── telegrafBot.js          # Telegram bot interface
├── data/
│   ├── asset-index.json        # Indexed design assets
│   └── course-knowledge.json   # Extracted topics/keywords
├── ecosystem.config.js         # PM2 deployment config
├── .env                        # Environment variables
└── package.json
```

### Key Classes

#### `AssetIndexer`
Analyzes PNG files for:
- Dimensions (width, height, aspect ratio)
- Visual consistency patterns
- Design language metadata

```javascript
const indexer = new AssetIndexer(assetDir);
await indexer.indexAllAssets();
const index = indexer.getIndex();
```

#### `CourseParser`
Extracts from course materials:
- Surgical specialties (10 types)
- Topics and keywords per specialty
- Content organization

```javascript
const parser = new CourseParser(courseDir);
await parser.parseAllMaterials();
const knowledge = parser.getKnowledge();
```

#### `CaptionGenerator`
Generates platform-specific captions:
- LinkedIn: Professional, thought-leadership
- Instagram: Engaging, visual-first, hashtags
- Meta: Community-focused storytelling
- X: Punchy, under 280 chars

```javascript
const gen = new CaptionGenerator(apiKey);
const captions = await gen.generateCaptions(context, assetId, specialty);
// Returns: { linkedin, instagram, meta, x }
```

#### `BufferClient`
Publishes to Buffer:
- Post immediately or schedule
- Track engagement metrics
- Get analytics

```javascript
const buffer = new BufferClient(accessToken);
await buffer.authenticate();
await buffer.postContent(content, platforms, scheduleTime);
```

## Deployment

### Local Development
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Production (VPS)

1. **Install PM2:**
   ```bash
   npm install -g pm2
   ```

2. **Deploy using ecosystem config:**
   ```bash
   pm2 start ecosystem.config.js --env production
   ```

3. **Monitor:**
   ```bash
   pm2 logs surgix-marketing-bot
   pm2 status
   ```

4. **Auto-start on reboot:**
   ```bash
   pm2 startup
   pm2 save
   ```

## API Integration

### Claude (Caption Generation)
- Model: claude-opus-4-1-20250805
- Rate limit: Standard tier
- Cost: ~$0.02-0.05 per 1K captions (depends on token usage)

### Buffer (Publishing)
- Profiles: LinkedIn, Instagram, Meta, X
- Features: Scheduling, analytics, engagement tracking
- Rate limit: Standard Buffer plan

### Telegram (User Interface)
- Bot token: Provided in .env
- Updates via long polling
- File uploads: Support for photo/document

## Next Steps (Phase 2)

- [ ] Competitor monitoring & analysis
- [ ] Hashtag strategy & trending tracking
- [ ] Visual consistency checks (design validation)
- [ ] Content calendar (weekly theme planning)
- [ ] Audience segmentation (specialty-based)
- [ ] A/B testing (caption variants)
- [ ] Advanced analytics dashboard

## Troubleshooting

### Bot not responding
- Check Telegram bot token in .env
- Verify bot is running: `pm2 status`
- Check logs: `pm2 logs surgix-marketing-bot`

### Captions not generating
- Check Claude API key
- Verify API quota/balance
- Check error logs for context issues

### Buffer posting fails
- Verify Buffer access token
- Check Buffer profile setup
- Ensure platforms are connected to Buffer

### Asset indexing slow
- Normal for 33 large PNG files
- Check disk space
- Increase Node memory: `NODE_OPTIONS=--max-old-space-size=1024`

## Support

For issues or questions, contact: [your contact]

---

**Built with:** Node.js, Telegraf, Claude, Buffer API, Sharp
**Deployed on:** VPS 173.249.37.7 (PM2)
**Last updated:** March 30, 2026
