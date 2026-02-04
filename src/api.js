/**
 * Dictionary API module
 * Uses ECDICT (local) as primary, Free Dictionary API as fallback
 * Fetches example sentences from Free Dictionary API and translates them
 */

import { lookupWord } from './ecdict.js';
import { translateToZh } from './translator.js';
import { fetchFallbackExamples } from './examples.js';

const FREE_DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';

/**
 * Fetch word data - tries ECDICT first, then Free Dictionary API
 * @param {string} word - The word to look up
 * @returns {Promise<object|null>} - Word entry or null if not found
 */
export async function fetchFromApi(word) {
  // Try ECDICT first (local, has Chinese translations)
  const ecdictResult = lookupWord(word);
  if (ecdictResult) {
    // Tier 1: Fetch examples from Free Dictionary API to supplement ECDICT
    let examplesByPos = await fetchExamplesFromFreeDictionary(word);

    // Count total examples from Tier 1
    const tier1Count = examplesByPos.flatMap(e => e.examples).length;

    // Tier 2: If examples < 3, try Wordnik/Azure Dictionary for more
    if (tier1Count < 3) {
      const fallback = await fetchFallbackExamples(word, ecdictResult.definitions, tier1Count);
      if (fallback.examples.length > 0) {
        examplesByPos.push({ partOfSpeech: 'general', examples: fallback.examples });
      }
    }

    if (examplesByPos.length > 0) {
      // Collect all English examples for batch translation
      const allExamples = examplesByPos.flatMap(e => e.examples);
      const translations = await translateToZh(allExamples.map(e => e.en));

      // Assign translations back to examples
      let idx = 0;
      for (const pos of examplesByPos) {
        for (const ex of pos.examples) {
          ex.zh = translations[idx++];
        }
      }

      // Merge examples into ECDICT result
      mergeExamples(ecdictResult, examplesByPos);
    }

    return ecdictResult;
  }

  // Fallback to Free Dictionary API (online, English only)
  return fetchFromFreeDictionary(word);
}

/**
 * Extract examples grouped by part of speech from Free Dictionary API response
 * @param {object} apiData - Raw API response data
 * @returns {Array<{partOfSpeech: string, examples: Array<{en: string, zh: string}>}>}
 */
function extractExamples(apiData) {
  if (!apiData?.length) return [];

  const result = [];
  for (const meaning of apiData[0].meanings || []) {
    const examples = [];
    for (const def of meaning.definitions || []) {
      if (def.example) {
        examples.push({ en: def.example, zh: '' });
      }
    }
    if (examples.length > 0) {
      result.push({ partOfSpeech: meaning.partOfSpeech, examples });
    }
  }
  return result;
}

/**
 * Fetch only examples from Free Dictionary API
 * @param {string} word - The word to look up
 * @returns {Promise<Array>} - Examples grouped by part of speech
 */
async function fetchExamplesFromFreeDictionary(word) {
  try {
    const response = await fetch(`${FREE_DICT_API}/${encodeURIComponent(word)}`);
    if (!response.ok) return [];
    return extractExamples(await response.json());
  } catch {
    return [];
  }
}

/**
 * Merge examples into word entry definitions
 * @param {object} entry - Word entry with definitions
 * @param {Array} examplesByPos - Examples grouped by part of speech
 */
function mergeExamples(entry, examplesByPos) {
  for (const def of entry.definitions) {
    // Initialize examples array if not present
    if (!def.examples) {
      def.examples = [];
    }

    // Match by part of speech (case-insensitive prefix match)
    const match = examplesByPos.find(
      e => e.partOfSpeech.toLowerCase().startsWith(def.partOfSpeech.toLowerCase())
    );
    if (match && def.examples.length === 0) {
      // Limit to max 5 examples per definition
      def.examples = match.examples.slice(0, 5);
    }
  }

  // Handle 'general' examples from fallback (Wordnik)
  // Assign to first definition without examples
  const generalExamples = examplesByPos.find(e => e.partOfSpeech === 'general');
  if (generalExamples) {
    const firstDefWithoutExamples = entry.definitions.find(d => !d.examples || d.examples.length === 0);
    if (firstDefWithoutExamples) {
      firstDefWithoutExamples.examples = generalExamples.examples.slice(0, 3);
    }
  }
}

/**
 * Fetch from Free Dictionary API (fallback)
 * @param {string} word - The word to look up
 * @returns {Promise<object|null>} - Word entry or null if not found
 */
async function fetchFromFreeDictionary(word) {
  try {
    const response = await fetch(`${FREE_DICT_API}/${encodeURIComponent(word)}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Word not found
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return transformApiResponse(word, data);
  } catch (error) {
    if (error.message.includes('fetch')) {
      console.error('Network error: Please check your internet connection.');
    }
    return null;
  }
}

/**
 * Transform API response to our dictionary format
 */
function transformApiResponse(word, apiData) {
  if (!apiData || !apiData.length) return null;

  const entry = apiData[0];

  // Get pronunciation (prefer US, fallback to first available)
  let pronunciation = '';
  if (entry.phonetics && entry.phonetics.length) {
    const usPhonetic = entry.phonetics.find(p => p.audio?.includes('-us'));
    const withText = entry.phonetics.find(p => p.text);
    pronunciation = usPhonetic?.text || withText?.text || entry.phonetic || '';
  } else if (entry.phonetic) {
    pronunciation = entry.phonetic;
  }

  // Get audio URL
  let audioUrl = '';
  if (entry.phonetics && entry.phonetics.length) {
    const withAudio = entry.phonetics.find(p => p.audio && p.audio.length > 0);
    audioUrl = withAudio?.audio || '';
  }

  // Transform meanings to our format
  const definitions = [];

  for (const meaning of entry.meanings || []) {
    const defs = meaning.definitions || [];

    for (const def of defs.slice(0, 2)) { // Take first 2 definitions per part of speech
      const examples = [];

      if (def.example) {
        examples.push({
          en: def.example,
          zh: '' // Chinese translation to be added later
        });
      }

      definitions.push({
        partOfSpeech: meaning.partOfSpeech || 'unknown',
        meaning: def.definition, // English definition (will add Chinese later)
        meaningZh: '', // Placeholder for Chinese translation
        examples
      });
    }
  }

  return {
    word: entry.word || word,
    pronunciation,
    audioUrl,
    definitions,
    sources: ['Online Dictionary']
  };
}

/**
 * Count total examples in a word entry
 * @param {object} entry - Word entry with definitions
 * @returns {number} - Total number of examples across all definitions
 */
function countExamples(entry) {
  if (!entry?.definitions) return 0;
  return entry.definitions.reduce((total, def) => total + (def.examples?.length || 0), 0);
}

const MIN_EXAMPLES = 3;

/**
 * Enrich a word entry with examples (fetch if fewer than MIN_EXAMPLES)
 * Used by learning session to ensure words have enough examples
 * @param {object} entry - Word entry with definitions
 * @returns {Promise<object>} - Same entry, potentially with examples added
 */
export async function enrichWithExamples(entry) {
  if (!entry?.word) return entry;

  // Count existing examples
  const existingCount = countExamples(entry);

  // Already has enough examples, no need to fetch
  if (existingCount >= MIN_EXAMPLES) return entry;

  // Tier 1: Fetch examples from Free Dictionary API
  let examplesByPos = await fetchExamplesFromFreeDictionary(entry.word);

  // Count total examples from Tier 1
  const tier1Count = examplesByPos.flatMap(e => e.examples).length;

  // Total count including existing
  const totalAfterTier1 = existingCount + tier1Count;

  // Tier 2+: If total examples < 3, try fallback sources for more
  if (totalAfterTier1 < MIN_EXAMPLES) {
    const fallback = await fetchFallbackExamples(entry.word, entry.definitions, totalAfterTier1);
    if (fallback.examples.length > 0) {
      examplesByPos.push({ partOfSpeech: 'general', examples: fallback.examples });
    }
  }

  if (examplesByPos.length > 0) {
    // Collect all English examples for batch translation
    const allExamples = examplesByPos.flatMap(e => e.examples);
    const translations = await translateToZh(allExamples.map(e => e.en));

    // Assign translations back to examples
    let idx = 0;
    for (const pos of examplesByPos) {
      for (const ex of pos.examples) {
        ex.zh = translations[idx++];
      }
    }

    // Merge examples into entry
    mergeExamples(entry, examplesByPos);
  }

  return entry;
}

export default { fetchFromApi, enrichWithExamples };
