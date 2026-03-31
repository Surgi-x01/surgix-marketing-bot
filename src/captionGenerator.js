/**
 * Caption Generator: Creates platform-specific captions using Claude
 * Generates: LinkedIn, Instagram, Meta, X variants
 */

const Anthropic = require('@anthropic-ai/sdk');

class CaptionGenerator {
  constructor(anthropicKey) {
    this.client = new Anthropic(anthropicKey);
    this.model = 'claude-opus-4-1-20250805';
    
    this.platformPrompts = {
      linkedin: `Generate a professional LinkedIn post caption for a Surgi-X marketing asset.
        
REQUIREMENTS:
- Tone: Professional, thought-leadership, authoritative
- Length: 2-3 paragraphs (400-600 chars)
- Include: Surgical insight, learning point, or innovation angle
- CTA: "What's your experience with [topic]?"
- NO hashtags in main text, but add 3-4 relevant hashtags at end
- Platform: LinkedIn
- Brand: Surgi-X (minimally invasive surgical solutions)

Generate ONLY the caption text, ready to post.`,

      instagram: `Generate an engaging Instagram post caption for a Surgi-X marketing asset.

REQUIREMENTS:
- Tone: Engaging, visual-first, conversational
- Length: 1-2 sentences + emojis
- Include: Eye-catching hook, relevant detail, clear CTA
- Emojis: 2-3 surgical/medical relevant emojis
- Hashtags: 5-8 relevant hashtags (include #SurgiX, #MinimallyInvasive, #SurgicalInnovation)
- CTA: "Tag a colleague who needs to see this" or "Double tap if you agree"
- Platform: Instagram
- Brand: Surgi-X

Generate ONLY the caption text, ready to post.`,

      meta: `Generate a community-focused Facebook/Meta post caption for a Surgi-X asset.

REQUIREMENTS:
- Tone: Community-focused, storytelling, warm but professional
- Length: 3-4 sentences + CTA
- Include: Why this matters, who should care, next step
- Emojis: 1-2 minimal, only if natural
- Hashtags: 3-5 relevant (optional)
- CTA: "Share your thoughts in the comments" or "Join the conversation"
- Platform: Meta/Facebook
- Brand: Surgi-X

Generate ONLY the caption text, ready to post.`,

      x: `Generate a punchy X (Twitter) post caption for a Surgi-X asset.

REQUIREMENTS:
- Tone: Concise, impactful, shareable
- Length: UNDER 280 characters (X limit)
- Include: Key insight, relevant detail, strong verb
- Hashtags: 2-3 max (include #SurgiX if space allows)
- Emojis: 0-1 if it adds value
- CTA: Implicit (make it shareable/quotable)
- Platform: X/Twitter
- Brand: Surgi-X

Generate ONLY the caption text, ready to post. Must be under 280 chars.`
    };
  }

  async generateCaptions(imageContext, assetId = null, specialty = null) {
    const context = this._buildContext(imageContext, assetId, specialty);
    
    try {
      const captions = {};

      for (const [platform, prompt] of Object.entries(this.platformPrompts)) {
        const fullPrompt = `${prompt}\n\nContext: ${context}`;
        
        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: fullPrompt
            }
          ]
        });

        captions[platform] = response.content[0].text.trim();
      }

      return {
        assetId,
        specialty,
        timestamp: new Date().toISOString(),
        captions,
        wordCounts: this._getWordCounts(captions)
      };
    } catch (err) {
      console.error('Error generating captions:', err);
      throw err;
    }
  }

  _buildContext(imageContext, assetId, specialty) {
    let context = 'Surgi-X is a leading provider of minimally invasive surgical solutions for healthcare providers across Africa.';
    
    if (assetId) {
      context += ` Asset ID: ${assetId}.`;
    }
    
    if (specialty) {
      context += ` Specialty focus: ${specialty}.`;
    }

    if (imageContext) {
      context += ` Image context: ${imageContext}.`;
    }

    context += ' The audience includes surgeons, hospital administrators, medical students, and healthcare professionals interested in surgical innovation.';

    return context;
  }

  _getWordCounts(captions) {
    const counts = {};
    for (const [platform, caption] of Object.entries(captions)) {
      counts[platform] = {
        characters: caption.length,
        words: caption.split(/\s+/).length,
        platformLimit: platform === 'x' ? 280 : 'unlimited'
      };
    }
    return counts;
  }

  formatForPlatform(caption, platform) {
    // Apply any platform-specific formatting
    switch (platform.toLowerCase()) {
      case 'linkedin':
        return caption;
      case 'instagram':
        return caption;
      case 'meta':
      case 'facebook':
        return caption;
      case 'x':
      case 'twitter':
        // Ensure under 280 chars
        if (caption.length > 280) {
          return caption.substring(0, 277) + '...';
        }
        return caption;
      default:
        return caption;
    }
  }

  async generateBatch(assets, specialty = null) {
    const results = [];
    for (const asset of assets) {
      try {
        const captions = await this.generateCaptions(
          asset.description || asset.context,
          asset.id,
          specialty
        );
        results.push(captions);
      } catch (err) {
        console.error(`Failed to generate captions for asset ${asset.id}:`, err);
      }
    }
    return results;
  }
}

module.exports = CaptionGenerator;
