/**
 * ECDICT module - Local English-Chinese dictionary
 * Uses ECDICT database with ~760,000 words and native Chinese translations
 */

import { searchWord, findLemma } from 'ecdict';

/**
 * Tag abbreviation to readable name mapping
 */
const TAG_NAMES = {
  'zk': '中考',
  'gk': '高考',
  'cet4': 'CET-4',
  'cet6': 'CET-6',
  'ky': '考研',
  'toefl': 'TOEFL',
  'ielts': 'IELTS',
  'gre': 'GRE'
};

/**
 * Parse ECDICT tags string to array of readable tags
 * @param {string} tagString - Space-separated tags like "gk cet4 cet6 ky toefl gre"
 * @returns {string[]} - Array of readable tag names
 */
function parseTags(tagString) {
  if (!tagString) return [];

  return tagString
    .split(/\s+/)
    .filter(tag => tag && TAG_NAMES[tag])
    .map(tag => TAG_NAMES[tag]);
}

/**
 * Parse ECDICT definition/translation that uses \n as delimiter
 * @param {string} text - Text with \n delimiters
 * @returns {string[]} - Array of lines
 */
function parseMultiline(text) {
  if (!text) return [];
  return text.split('\\n').map(s => s.trim()).filter(Boolean);
}

/**
 * Normalize part of speech to group similar types
 * v, vt, vi → v (verb), n → n (noun), etc.
 */
function normalizePartOfSpeech(pos) {
  const normalized = pos.toLowerCase().replace('.', '');
  // Group verb variants
  if (normalized.startsWith('v')) return 'v';
  // Group noun variants
  if (normalized.startsWith('n')) return 'n';
  // Group adjective variants
  if (normalized.startsWith('adj') || normalized === 'a') return 'adj';
  // Group adverb variants
  if (normalized.startsWith('adv')) return 'adv';
  return normalized || 'other';
}

/**
 * Parse part of speech from definition line
 * E.g., "n. an expression of greeting" -> { pos: "n.", meaning: "an expression of greeting" }
 */
function parseDefinitionLine(line) {
  const match = line.match(/^([a-z]+\.)\s*(.*)$/i);
  if (match) {
    return { pos: match[1], meaning: match[2] };
  }
  return { pos: '', meaning: line };
}

/**
 * Look up a word in ECDICT
 * @param {string} word - The word to look up
 * @returns {object|null} - Word entry in our format or null if not found
 */
export function lookupWord(word) {
  const result = searchWord(word, { caseInsensitive: true });

  if (!result) {
    return null;
  }

  // Check if we have actual content (definition or translation)
  if (!result.definition && !result.translation) {
    return null;
  }

  // Parse English definitions and Chinese translations
  const englishDefs = parseMultiline(result.definition);
  const chineseDefs = parseMultiline(result.translation);

  // Build definitions array matching English with Chinese
  const definitions = [];

  // Group by normalized part of speech (v, vt, vi all become 'v')
  const defMap = new Map();

  for (const line of englishDefs) {
    const { pos, meaning } = parseDefinitionLine(line);
    const key = normalizePartOfSpeech(pos);
    if (!defMap.has(key)) {
      defMap.set(key, { meanings: [], meaningsZh: [] });
    }
    defMap.get(key).meanings.push(meaning);
  }

  // Add Chinese translations (they follow same structure)
  for (const line of chineseDefs) {
    const { pos, meaning } = parseDefinitionLine(line);
    const key = normalizePartOfSpeech(pos);
    if (!defMap.has(key)) {
      defMap.set(key, { meanings: [], meaningsZh: [] });
    }
    defMap.get(key).meaningsZh.push(meaning);
  }

  // Convert to our format - prefer Chinese over English
  for (const [pos, data] of defMap) {
    // Skip entries that only have English meaning (no Chinese)
    if (data.meaningsZh.length === 0) continue;

    definitions.push({
      partOfSpeech: pos || 'unknown',
      meaning: data.meanings.join('; '),
      meaningZh: data.meaningsZh.join('; '),
      examples: []
    });
  }

  // Parse exam tags
  const tags = parseTags(result.tag);

  return {
    word: result.word || word,
    pronunciation: result.phonetic ? `/${result.phonetic}/` : '',
    audioUrl: '',
    definitions,
    tags,
    collins: result.collins ? parseInt(result.collins) : null,
    oxford: result.oxford === '1',
    sources: ['ECDICT']
  };
}

/**
 * Find the base form (lemma) of a word
 * @param {string} word - The word to look up
 * @returns {object|null} - Lemma info or null
 */
export function findWordLemma(word) {
  return findLemma(word, true);
}

export default { lookupWord, findWordLemma };
