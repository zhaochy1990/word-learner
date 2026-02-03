/**
 * CET (College English Test) word list extraction and progress management
 * Extracts CET4/CET6 vocabulary from ECDICT and manages learning progress
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { DEFAULT_LEARNING } from './learn.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', 'data');
const ECDICT_PATH = join(__dirname, '..', 'node_modules/ecdict/data/dict.json');

// Supported CET categories
const CATEGORIES = ['cet4', 'cet6'];

/**
 * Ensure data directory exists
 */
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Get file paths for a category
 * @param {string} category - 'cet4' or 'cet6'
 * @returns {Object} - { wordListPath, progressPath }
 */
function getPaths(category) {
  return {
    wordListPath: join(DATA_DIR, `${category}.json`),
    progressPath: join(DATA_DIR, `${category}-progress.json`)
  };
}

/**
 * Parse ECDICT translation field into structured definitions
 * @param {string} translation - Raw translation string (e.g., "vt. xxx\\nn. yyy")
 * @returns {Array} - Array of { partOfSpeech, meaningZh }
 */
function parseDefinitions(translation) {
  if (!translation) return [];

  const definitions = [];
  const parts = translation.split('\\n');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Match patterns like "n. xxx", "vt. xxx", "a. xxx"
    const match = trimmed.match(/^([a-z]+\.)\s*(.+)$/i);
    if (match) {
      definitions.push({
        partOfSpeech: match[1].replace('.', ''),
        meaningZh: match[2]
      });
    } else {
      // No part of speech prefix, use as-is
      definitions.push({
        partOfSpeech: '?',
        meaningZh: trimmed
      });
    }
  }

  return definitions;
}

/**
 * Check if word list is already extracted
 * @param {string} category - 'cet4' or 'cet6'
 * @returns {boolean}
 */
export function isExtracted(category) {
  if (!CATEGORIES.includes(category)) {
    throw new Error(`Invalid category: ${category}. Must be 'cet4' or 'cet6'`);
  }
  const { wordListPath } = getPaths(category);
  return existsSync(wordListPath);
}

/**
 * Extract word list from ECDICT by tag
 * @param {string} category - 'cet4' or 'cet6'
 * @param {Function} onProgress - Optional progress callback(current, total)
 * @returns {number} - Number of words extracted
 */
export function extractWordList(category, onProgress = null) {
  if (!CATEGORIES.includes(category)) {
    throw new Error(`Invalid category: ${category}. Must be 'cet4' or 'cet6'`);
  }

  ensureDataDir();

  // Load ECDICT
  const ecdict = JSON.parse(readFileSync(ECDICT_PATH, 'utf-8'));
  const entries = Object.values(ecdict);
  const total = entries.length;

  const words = [];
  let processed = 0;

  for (const entry of entries) {
    processed++;

    if (!entry.tag) continue;
    const tags = entry.tag.split(/\s+/);

    if (tags.includes(category)) {
      words.push({
        word: entry.word,
        pronunciation: entry.phonetic ? `/${entry.phonetic}/` : '',
        definitions: parseDefinitions(entry.translation),
        collins: parseInt(entry.collins) || 0,
        oxford: entry.oxford === '1' || entry.oxford === 1
      });
    }

    // Report progress every 10000 entries
    if (onProgress && processed % 10000 === 0) {
      onProgress(processed, total);
    }
  }

  // Sort alphabetically
  words.sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));

  // Save to file
  const { wordListPath } = getPaths(category);
  writeFileSync(wordListPath, JSON.stringify(words, null, 2), 'utf-8');

  return words.length;
}

/**
 * Load word list from file
 * @param {string} category - 'cet4' or 'cet6'
 * @returns {Array|null} - Word list or null if not extracted
 */
export function getWordList(category) {
  if (!CATEGORIES.includes(category)) {
    throw new Error(`Invalid category: ${category}. Must be 'cet4' or 'cet6'`);
  }

  const { wordListPath } = getPaths(category);

  if (!existsSync(wordListPath)) {
    return null;
  }

  return JSON.parse(readFileSync(wordListPath, 'utf-8'));
}

/**
 * Get word count for a category
 * @param {string} category - 'cet4' or 'cet6'
 * @returns {number} - Word count (0 if not extracted)
 */
export function getWordCount(category) {
  const words = getWordList(category);
  return words ? words.length : 0;
}

/**
 * Get estimated word count without extraction
 * @param {string} category - 'cet4' or 'cet6'
 * @returns {number} - Estimated count
 */
export function getEstimatedCount(category) {
  const estimates = {
    cet4: 3849,
    cet6: 5407
  };
  return estimates[category] || 0;
}

// ==================== Progress Management ====================

/**
 * Load progress file for a category
 * @param {string} category - 'cet4' or 'cet6'
 * @returns {Object} - Progress data { words: {...}, lastUpdated: ... }
 */
export function getProgress(category) {
  if (!CATEGORIES.includes(category)) {
    throw new Error(`Invalid category: ${category}. Must be 'cet4' or 'cet6'`);
  }

  const { progressPath } = getPaths(category);

  if (!existsSync(progressPath)) {
    return { words: {}, lastUpdated: null };
  }

  return JSON.parse(readFileSync(progressPath, 'utf-8'));
}

/**
 * Save progress file for a category
 * @param {string} category - 'cet4' or 'cet6'
 * @param {Object} progress - Progress data
 */
export function saveProgress(category, progress) {
  if (!CATEGORIES.includes(category)) {
    throw new Error(`Invalid category: ${category}. Must be 'cet4' or 'cet6'`);
  }

  ensureDataDir();
  const { progressPath } = getPaths(category);

  progress.lastUpdated = new Date().toISOString();
  writeFileSync(progressPath, JSON.stringify(progress, null, 2), 'utf-8');
}

/**
 * Get learning state for a specific word
 * @param {string} category - 'cet4' or 'cet6'
 * @param {string} word - The word
 * @returns {Object} - Learning state (SM-2 fields)
 */
export function getWordLearningState(category, word) {
  const progress = getProgress(category);
  return progress.words[word.toLowerCase()] || { ...DEFAULT_LEARNING };
}

/**
 * Update learning state for a specific word
 * @param {string} category - 'cet4' or 'cet6'
 * @param {string} word - The word
 * @param {Object} state - New learning state
 */
export function updateWordLearningState(category, word, state) {
  const progress = getProgress(category);
  progress.words[word.toLowerCase()] = state;
  saveProgress(category, progress);
}

/**
 * Get words ready for learning session
 * @param {string} category - 'cet4' or 'cet6'
 * @param {number} maxNewWords - Maximum new words to include (default 10)
 * @returns {Array} - Words ready for learning (with learning state attached)
 */
export function getWordsForLearning(category, maxNewWords = 10) {
  const words = getWordList(category);
  if (!words) return [];

  const progress = getProgress(category);
  const now = new Date();

  const dueWords = [];
  const newWords = [];

  for (const wordEntry of words) {
    const wordKey = wordEntry.word.toLowerCase();
    const learning = progress.words[wordKey] || { ...DEFAULT_LEARNING };

    // Attach learning state to word entry
    const wordWithLearning = { ...wordEntry, learning };

    if (learning.level === 0) {
      // New word
      newWords.push(wordWithLearning);
    } else if (learning.nextReviewAt) {
      // Check if due for review
      const nextReview = new Date(learning.nextReviewAt);
      if (nextReview <= now) {
        dueWords.push(wordWithLearning);
      }
    }
  }

  // Return due words + limited new words
  const selectedNew = newWords.slice(0, maxNewWords);
  return [...dueWords, ...selectedNew];
}

/**
 * Get learning statistics for a category
 * @param {string} category - 'cet4' or 'cet6'
 * @returns {Object} - Statistics { total, byLevel, dueToday, newAvailable, mastered }
 */
export function getLearningStats(category) {
  const words = getWordList(category);
  if (!words) {
    return {
      total: 0,
      byLevel: [0, 0, 0, 0, 0, 0],
      dueToday: 0,
      newAvailable: 0,
      mastered: 0
    };
  }

  const progress = getProgress(category);
  const now = new Date();

  const stats = {
    total: words.length,
    byLevel: [0, 0, 0, 0, 0, 0], // Counts for levels 0-5
    dueToday: 0,
    newAvailable: 0,
    mastered: 0
  };

  for (const wordEntry of words) {
    const wordKey = wordEntry.word.toLowerCase();
    const learning = progress.words[wordKey] || { ...DEFAULT_LEARNING };

    stats.byLevel[learning.level]++;

    if (learning.level === 0) {
      stats.newAvailable++;
    } else if (learning.level === 5) {
      stats.mastered++;
    }

    if (learning.nextReviewAt) {
      const nextReview = new Date(learning.nextReviewAt);
      if (nextReview <= now) {
        stats.dueToday++;
      }
    }
  }

  return stats;
}

/**
 * Get category display name
 * @param {string} category - 'cet4' or 'cet6'
 * @returns {string} - Display name
 */
export function getCategoryDisplayName(category) {
  const names = {
    cet4: 'CET-4',
    cet6: 'CET-6'
  };
  return names[category] || category.toUpperCase();
}
