/**
 * Course Materials Parser: Extract topics from surgical education materials
 * Builds knowledge base of surgical specialties and educational content
 */

const fs = require('fs');
const path = require('path');

class CourseParser {
  constructor(courseDir) {
    this.courseDir = courseDir;
    this.knowledge = {
      specialties: {},
      allTopics: new Set(),
      contentTypes: {},
      timestamp: new Date().toISOString()
    };
  }

  async parseAllMaterials() {
    console.log('📚 Parsing course materials...');

    try {
      const specialties = fs.readdirSync(this.courseDir)
        .filter(f => !f.startsWith('.'))
        .filter(f => fs.statSync(path.join(this.courseDir, f)).isDirectory());

      console.log(`Found ${specialties.length} specialties`);

      for (const specialty of specialties) {
        await this._parseSpecialty(specialty);
      }

      return this.knowledge;
    } catch (err) {
      console.error('Error parsing materials:', err);
      throw err;
    }
  }

  async _parseSpecialty(specialtyName) {
    const specialtyPath = path.join(this.courseDir, specialtyName);
    const files = fs.readdirSync(specialtyPath).filter(f => !f.startsWith('.'));

    const topics = [];
    const keywords = [];

    // Try to extract content from readable files
    for (const file of files) {
      const filePath = path.join(specialtyPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        // Extract filename as topic
        const basename = path.parse(file).name;
        topics.push(basename);

        // Build keywords from filename/content
        keywords.push(...this._extractKeywords(basename));
      }
    }

    this.knowledge.specialties[specialtyName] = {
      displayName: specialtyName,
      fileCount: files.length,
      topics: topics,
      keywords: [...new Set(keywords)],
      contentPath: specialtyPath,
      category: this._categorizeSpecialty(specialtyName)
    };

    console.log(`  ✓ ${specialtyName} (${files.length} files, ${topics.length} topics)`);
  }

  _extractKeywords(text) {
    // Common surgical keywords
    const keywords = text
      .toLowerCase()
      .split(/[\s_\-\.]+/)
      .filter(word => word.length > 2);
    return keywords;
  }

  _categorizeSpecialty(specialty) {
    const specialties = {
      'Basics': 'Foundational',
      'Foundamental of MIS': 'Foundational',
      'General surgery': 'General',
      'Bariatric Surgery': 'Specialist',
      'Colorectal Surgery': 'Specialist',
      'Gynecological Surgery': 'Specialist',
      'Pediatric Surgery': 'Specialist',
      'Thoracic Surgery': 'Specialist',
      'Urological Surgery': 'Specialist'
    };
    return specialties[specialty] || 'Unknown';
  }

  saveKnowledgeBase(outputPath = './data/course-knowledge.json') {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const knowledgeData = {
      ...this.knowledge,
      allTopics: Array.from(this.knowledge.allTopics)
    };

    fs.writeFileSync(outputPath, JSON.stringify(knowledgeData, null, 2));
    console.log(`✓ Knowledge base saved to ${outputPath}`);
    return outputPath;
  }

  getKnowledge() {
    return this.knowledge;
  }

  getSpecialties() {
    return Object.keys(this.knowledge.specialties);
  }

  getSpecialtyInfo(specialty) {
    return this.knowledge.specialties[specialty] || null;
  }

  getKnowledgeSummary() {
    const specialtyCount = Object.keys(this.knowledge.specialties).length;
    const totalTopics = Object.values(this.knowledge.specialties)
      .reduce((sum, s) => sum + s.topics.length, 0);

    return `Surgi-X Course Knowledge:
- Specialties: ${specialtyCount}
- Total Topics: ${totalTopics}
- Specialties: ${Object.keys(this.knowledge.specialties).join(', ')}`;
  }
}

module.exports = CourseParser;
