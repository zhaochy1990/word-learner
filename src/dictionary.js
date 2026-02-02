/**
 * Dictionary module - uses ECDICT (local) with Free Dictionary API fallback
 */

import { fetchFromApi } from './api.js';

class Dictionary {
  constructor() {
    this.searchHistory = [];
  }

  /**
   * Look up a word - uses ECDICT first, then Free Dictionary API
   * @param {string} word - The word to look up
   * @returns {Promise<object|null>} - Word entry or null
   */
  async lookup(word) {
    const normalizedWord = word.toLowerCase().trim();

    const entry = await fetchFromApi(normalizedWord);

    if (entry) {
      this.addToHistory(word);
      return entry;
    }

    return null;
  }

  addToHistory(word) {
    // Remove if already exists
    this.searchHistory = this.searchHistory.filter(
      w => w.toLowerCase() !== word.toLowerCase()
    );
    // Add to beginning
    this.searchHistory.unshift(word);
    // Keep only last 10
    if (this.searchHistory.length > 10) {
      this.searchHistory = this.searchHistory.slice(0, 10);
    }
  }

  getHistory() {
    return this.searchHistory;
  }
}

export default Dictionary;
