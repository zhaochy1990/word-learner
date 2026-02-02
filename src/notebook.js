import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { DEFAULT_LEARNING, LEVEL_NAMES } from './learn.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Notebook {
  constructor() {
    this.filePath = join(__dirname, '..', 'notebook.json');
    this.words = [];
    this.load();
  }

  load() {
    try {
      if (existsSync(this.filePath)) {
        const data = JSON.parse(readFileSync(this.filePath, 'utf-8'));
        this.words = data.words || [];
        // Migrate existing entries to include learning field
        this.migrateWords();
      }
    } catch (error) {
      this.words = [];
    }
  }

  /**
   * Migrate existing words to include learning field
   */
  migrateWords() {
    let needsSave = false;
    for (const word of this.words) {
      if (!word.learning) {
        word.learning = { ...DEFAULT_LEARNING };
        needsSave = true;
      }
    }
    if (needsSave) {
      this.save();
    }
  }

  /**
   * Ensure a word entry has learning fields
   * @param {Object} entry - Word entry
   * @returns {Object} - Entry with learning fields
   */
  ensureLearningFields(entry) {
    if (!entry.learning) {
      entry.learning = { ...DEFAULT_LEARNING };
    }
    return entry;
  }

  save() {
    try {
      writeFileSync(this.filePath, JSON.stringify({ words: this.words }, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error(`Failed to save notebook: ${error.message}`);
      return false;
    }
  }

  addWord(wordEntry, source) {
    // Check if word already exists
    const existingIndex = this.words.findIndex(
      w => w.word.toLowerCase() === wordEntry.word.toLowerCase()
    );

    const entry = {
      word: wordEntry.word,
      pronunciation: wordEntry.pronunciation,
      definitions: wordEntry.definitions,
      source: source || (wordEntry.sources ? wordEntry.sources[0] : 'Unknown'),
      addedAt: new Date().toISOString(),
      learning: { ...DEFAULT_LEARNING }
    };

    if (existingIndex >= 0) {
      // Update existing entry
      this.words[existingIndex] = entry;
    } else {
      // Add new entry
      this.words.push(entry);
    }

    return this.save();
  }

  removeWord(word) {
    const initialLength = this.words.length;
    this.words = this.words.filter(
      w => w.word.toLowerCase() !== word.toLowerCase()
    );

    if (this.words.length < initialLength) {
      return this.save();
    }
    return false;
  }

  getWords() {
    return this.words;
  }

  hasWord(word) {
    return this.words.some(
      w => w.word.toLowerCase() === word.toLowerCase()
    );
  }

  /**
   * Get words that are due for learning/review
   * @param {number} maxNewWords - Maximum new words to include (default 10)
   * @returns {Array} - Words ready for learning session
   */
  getWordsForLearning(maxNewWords = 10) {
    const now = new Date();
    const dueWords = [];
    const newWords = [];

    for (const word of this.words) {
      this.ensureLearningFields(word);
      const { learning } = word;

      if (learning.level === 0) {
        // New word - not yet reviewed
        newWords.push(word);
      } else if (learning.nextReviewAt) {
        // Check if due for review
        const nextReview = new Date(learning.nextReviewAt);
        if (nextReview <= now) {
          dueWords.push(word);
        }
      }
    }

    // Return due words + limited new words
    const selectedNew = newWords.slice(0, maxNewWords);
    return [...dueWords, ...selectedNew];
  }

  /**
   * Update learning state for a word
   * @param {string} wordText - The word to update
   * @param {Object} learningState - New learning state
   * @returns {boolean} - Success
   */
  updateWordLearning(wordText, learningState) {
    const word = this.words.find(
      w => w.word.toLowerCase() === wordText.toLowerCase()
    );

    if (word) {
      word.learning = learningState;
      return this.save();
    }
    return false;
  }

  /**
   * Get learning statistics for all words
   * @returns {Object} - Statistics by level
   */
  getLearningStats() {
    const stats = {
      total: this.words.length,
      byLevel: [0, 0, 0, 0, 0, 0], // Counts for levels 0-5
      dueToday: 0,
      newAvailable: 0
    };

    const now = new Date();

    for (const word of this.words) {
      this.ensureLearningFields(word);
      const { learning } = word;

      stats.byLevel[learning.level]++;

      if (learning.level === 0) {
        stats.newAvailable++;
      } else if (learning.nextReviewAt) {
        const nextReview = new Date(learning.nextReviewAt);
        if (nextReview <= now) {
          stats.dueToday++;
        }
      }
    }

    return stats;
  }
}

export default Notebook;
