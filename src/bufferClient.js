/**
 * Buffer API Client: Post to LinkedIn, Instagram, Meta, X via Buffer
 * Handles: scheduling, publishing, tracking
 */

const axios = require('axios');

class BufferClient {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = 'https://api.bufferapp.com/1';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Buffer profile IDs (to be populated after first auth)
    this.profiles = {};
  }

  async authenticate() {
    try {
      const response = await this.client.get('/profiles.json');
      this.profiles = {};
      
      response.data.forEach(profile => {
        this.profiles[profile.service] = profile.id;
      });

      console.log('✓ Buffer authenticated');
      console.log(`  Available profiles: ${Object.keys(this.profiles).join(', ')}`);
      return this.profiles;
    } catch (err) {
      console.error('Buffer authentication failed:', err.message);
      throw err;
    }
  }

  async postContent(content, platforms = ['linkedin', 'instagram', 'facebook', 'twitter'], scheduleTime = null) {
    /**
     * Post content to Buffer
     * 
     * content: {
     *   text: "Caption text",
     *   image: "image URL or path",
     *   assetId: "design asset ID"
     * }
     */

    try {
      const results = [];

      for (const platform of platforms) {
        const profileId = this.profiles[this._mapPlatform(platform)];
        
        if (!profileId) {
          console.warn(`⚠️ No Buffer profile for ${platform}, skipping`);
          continue;
        }

        const payload = {
          profile_ids: [profileId],
          text: content.text,
          shorten: true
        };

        // Add image if provided
        if (content.image) {
          payload.media = {
            link: content.image
          };
        }

        // Schedule if time provided
        if (scheduleTime) {
          payload.publish_now = false;
          payload.scheduled_at = Math.floor(new Date(scheduleTime).getTime() / 1000);
        } else {
          payload.publish_now = true;
        }

        try {
          const response = await this.client.post('/updates/create.json', payload);
          results.push({
            platform,
            status: 'scheduled' in payload ? 'scheduled' : 'published',
            bufferId: response.data.id,
            updateUrl: response.data.update_url
          });
          console.log(`  ✓ Posted to ${platform}`);
        } catch (err) {
          results.push({
            platform,
            status: 'failed',
            error: err.response?.data?.message || err.message
          });
          console.error(`  ✗ Failed to post to ${platform}: ${err.message}`);
        }
      }

      return results;
    } catch (err) {
      console.error('Error posting content:', err);
      throw err;
    }
  }

  async getPostMetrics(bufferId) {
    try {
      const response = await this.client.get(`/updates/${bufferId}/interactions.json`);
      return response.data;
    } catch (err) {
      console.error('Error fetching metrics:', err.message);
      throw err;
    }
  }

  async getAnalytics(period = 'week') {
    /**
     * Get analytics for all profiles
     * period: 'day', 'week', 'month'
     */
    try {
      const analytics = {};
      
      for (const [service, profileId] of Object.entries(this.profiles)) {
        try {
          const response = await this.client.get(`/analytics/profiles/${profileId}/${period}.json`);
          analytics[service] = response.data;
        } catch (err) {
          console.warn(`Could not fetch analytics for ${service}: ${err.message}`);
        }
      }

      return analytics;
    } catch (err) {
      console.error('Error fetching analytics:', err);
      throw err;
    }
  }

  async schedulePost(content, scheduledTime, platforms = ['linkedin', 'instagram', 'facebook', 'twitter']) {
    return this.postContent(content, platforms, scheduledTime);
  }

  _mapPlatform(platform) {
    const mapping = {
      'linkedin': 'linkedin',
      'instagram': 'instagram',
      'meta': 'facebook',
      'facebook': 'facebook',
      'x': 'twitter',
      'twitter': 'twitter'
    };
    return mapping[platform.toLowerCase()] || platform;
  }

  async testConnection() {
    try {
      const response = await this.client.get('/user.json');
      console.log(`✓ Connected to Buffer as: ${response.data.name}`);
      return response.data;
    } catch (err) {
      console.error('Buffer connection test failed:', err.message);
      throw err;
    }
  }
}

module.exports = BufferClient;
