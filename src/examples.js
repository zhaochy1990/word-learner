/**
 * Fallback example sentence providers
 * Tier 2: Wordnik API (requires API key, high-quality real-world examples)
 */

import 'dotenv/config';

const WORDNIK_API = 'https://api.wordnik.com/v4/word.json';
const WORDNIK_KEY = process.env.WORDNIK_API_KEY;

/**
 * Fetch examples from Wordnik API (requires API key)
 * @param {string} word - The word to look up
 * @param {number} limit - Maximum number of examples to fetch
 * @returns {Promise<Array<{en: string, zh: string}>>} - Examples array
 */
export async function fetchExamplesFromWordnik(word, limit = 3) {
  if (!WORDNIK_KEY) return [];

  try {
    const url = `${WORDNIK_API}/${encodeURIComponent(word)}/examples?limit=${limit}&api_key=${WORDNIK_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    return (data.examples || []).map(ex => ({ en: ex.text, zh: '' }));
  } catch {
    return [];
  }
}

/**
 * Main fallback function: Tier 2 only (Wordnik)
 * (Tier 1 Free Dictionary is handled in api.js before calling this)
 * @param {string} word - The word to get examples for
 * @returns {Promise<{examples: Array<{en: string, zh: string}>, source: string|null}>}
 */
export async function fetchFallbackExamples(word) {
  // Tier 2: Try Wordnik if API key is configured
  const wordnikExamples = await fetchExamplesFromWordnik(word);
  if (wordnikExamples.length > 0) {
    return { examples: wordnikExamples, source: 'Wordnik' };
  }

  // No fallback - return empty
  return { examples: [], source: null };
}
