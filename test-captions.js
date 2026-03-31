#!/usr/bin/env node

/**
 * Test caption generation (mock mode, doesn't call Claude)
 */

const CaptionGenerator = require('./src/captionGenerator');

async function test() {
  console.log('🧪 Testing Caption Generator...\n');

  const gen = new CaptionGenerator(process.env.ANTHROPIC_API_KEY || 'test-key');

  // Mock captions (since we're testing without API)
  const mockCaptions = {
    linkedin: `🏥 Minimally Invasive Surgery: The Future of Surgical Care

At Surgi-X, we believe the future of surgery is minimal, precise, and patient-focused. Minimally invasive procedures reduce recovery time, minimize complications, and improve patient outcomes.

Our comprehensive surgical solutions empower healthcare providers across Africa to deliver world-class care. From laparoscopic techniques to advanced equipment, we're committed to advancing surgical excellence.

What's your experience with minimally invasive surgical techniques? Share your insights in the comments below.

#SurgicalInnovation #MinimallyInvasive #MedTech #SurgiX`,

    instagram: `✂️ Surgery Redefined. Minimal Incisions. Maximum Impact. 

Experience the future of surgical care with Surgi-X's cutting-edge minimally invasive solutions. 🏥💡

Tag a colleague who should see this. 👇`,

    meta: `Minimally invasive surgery is transforming healthcare across the continent. At Surgi-X, we're proud to support healthcare providers in delivering advanced surgical care with minimal patient impact.

Our platforms connect surgeons, equipment, and expertise to create better outcomes. Join the surgical innovation movement. Share your thoughts — what advances in surgical technology are you most excited about?`,

    x: `🏥 Less trauma. Faster recovery. Better outcomes. That's the power of minimally invasive surgery with Surgi-X. Transforming African healthcare. #SurgicalInnovation #MedTech #SurgiX`
  };

  // Calculate word counts
  const wordCounts = {};
  for (const [platform, caption] of Object.entries(mockCaptions)) {
    wordCounts[platform] = {
      characters: caption.length,
      words: caption.split(/\s+/).length,
      platformLimit: platform === 'x' ? 280 : 'unlimited'
    };
  }

  const result = {
    assetId: 'demo-1',
    specialty: 'General Surgery',
    timestamp: new Date().toISOString(),
    captions: mockCaptions,
    wordCounts
  };

  console.log('✨ Caption Preview\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📱 LINKEDIN:');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(result.captions.linkedin);
  console.log('');
  console.log(`Characters: ${result.wordCounts.linkedin.characters} | Words: ${result.wordCounts.linkedin.words}`);
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📷 INSTAGRAM:');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(result.captions.instagram);
  console.log('');
  console.log(`Characters: ${result.wordCounts.instagram.characters} | Words: ${result.wordCounts.instagram.words}`);
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('👥 META/FACEBOOK:');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(result.captions.meta);
  console.log('');
  console.log(`Characters: ${result.wordCounts.meta.characters} | Words: ${result.wordCounts.meta.words}`);
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('𝕏 X (TWITTER):');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(result.captions.x);
  console.log('');
  console.log(`Characters: ${result.wordCounts.x.characters} | Words: ${result.wordCounts.x.words} | LIMIT: 280`);
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ All captions ready for posting');
}

test().catch(console.error);
