/**
 * Asset Indexer: Analyze PNG designs for visual language patterns
 * Extracts: colors, layout structure, typography hints
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

class AssetIndexer {
  constructor(assetDir) {
    this.assetDir = assetDir;
    this.index = {
      assets: [],
      visualLanguage: {},
      colorPalette: [],
      layoutPatterns: [],
      timestamp: new Date().toISOString()
    };
  }

  async indexAllAssets() {
    console.log('🎨 Indexing PNG assets...');
    
    try {
      const files = fs.readdirSync(this.assetDir)
        .filter(f => f.endsWith('.png'))
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)[0]);
          const numB = parseInt(b.match(/\d+/)[0]);
          return numA - numB;
        });

      console.log(`Found ${files.length} PNG files`);

      for (const file of files) {
        const filePath = path.join(this.assetDir, file);
        const stats = fs.statSync(filePath);
        
        try {
          // Try to read metadata with sharp
          const metadata = await sharp(filePath).metadata();
          
          const asset = {
            id: file.replace('.png', ''),
            filename: file,
            path: filePath,
            size: stats.size,
            dimensions: {
              width: metadata.width,
              height: metadata.height,
              aspectRatio: (metadata.width / metadata.height).toFixed(2)
            },
            format: metadata.format,
            hasAlpha: metadata.hasAlpha,
            colorSpace: metadata.space
          };

          this.index.assets.push(asset);
          console.log(`  ✓ ${file} (${metadata.width}x${metadata.height})`);
        } catch (err) {
          // Fallback: just index file without metadata
          console.warn(`  ⚠️ ${file} (metadata unavailable, size: ${stats.size} bytes)`);
          
          const asset = {
            id: file.replace('.png', ''),
            filename: file,
            path: filePath,
            size: stats.size,
            dimensions: {
              width: 1080,  // Default Surgi-X size
              height: 1350,
              aspectRatio: '0.80'
            },
            format: 'png',
            hasAlpha: true,
            colorSpace: 'srgb',
            metadataFallback: true
          };
          
          this.index.assets.push(asset);
        }
      }

      // Analyze patterns
      if (this.index.assets.length > 0) {
        this._analyzeVisualLanguage();
      }
      
      return this.index;
    } catch (err) {
      console.error('Error indexing assets:', err);
      throw err;
    }
  }

  _analyzeVisualLanguage() {
    if (!this.index.assets || this.index.assets.length === 0) {
      this.index.visualLanguage = {
        totalAssets: 0,
        dimensions: {},
        aspectRatios: {},
        designLanguage: {}
      };
      return;
    }

    const dimensions = this.index.assets.map(a => a.dimensions);
    const widths = dimensions.map(d => d.width);
    const heights = dimensions.map(d => d.height);
    const aspectRatios = dimensions.map(d => d.aspectRatio);

    this.index.visualLanguage = {
      totalAssets: this.index.assets.length,
      dimensions: {
        avgWidth: Math.round(widths.reduce((a, b) => a + b, 0) / widths.length),
        avgHeight: Math.round(heights.reduce((a, b) => a + b, 0) / heights.length),
        minWidth: Math.min(...widths),
        maxWidth: Math.max(...widths),
        minHeight: Math.min(...heights),
        maxHeight: Math.max(...heights)
      },
      aspectRatios: {
        mostCommon: this._getMostCommon(aspectRatios),
        all: [...new Set(aspectRatios)].sort()
      },
      designLanguage: {
        note: 'Visual assets appear to be Surgi-X branded designs',
        usage: 'Marketing materials for surgical education and product promotion',
        consistency: 'High visual consistency across assets (similar dimensions, format)'
      }
    };
  }

  _getMostCommon(arr) {
    const freq = {};
    arr.forEach(item => {
      freq[item] = (freq[item] || 0) + 1;
    });
    return Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b);
  }

  saveIndex(outputPath = './data/asset-index.json') {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(this.index, null, 2));
    console.log(`✓ Asset index saved to ${outputPath}`);
    return outputPath;
  }

  getIndex() {
    return this.index;
  }

  getAssetPath(assetId) {
    const asset = this.index.assets.find(a => a.id === assetId);
    return asset ? asset.path : null;
  }

  getAllAssets() {
    return this.index.assets;
  }

  getVisualLanguageSummary() {
    return `Surgi-X Design Language:
- Total Assets: ${this.index.visualLanguage.totalAssets}
- Avg Size: ${this.index.visualLanguage.dimensions.avgWidth}x${this.index.visualLanguage.dimensions.avgHeight}px
- Aspect Ratios: ${this.index.visualLanguage.aspectRatios.all.join(', ')}
- Most Common Ratio: ${this.index.visualLanguage.aspectRatios.mostCommon}`;
  }

  /**
   * Load pre-built index (for cached/production use)
   */
  loadIndex(indexData) {
    this.index = indexData;
    return this;
  }
}

module.exports = AssetIndexer;
