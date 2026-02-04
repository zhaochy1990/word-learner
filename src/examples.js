/**
 * Fallback example sentence providers
 * Tier 2a: Wordnik API (requires API key, high-quality real-world examples)
 * Tier 2b: Azure Translator Dictionary Examples API (reuses existing Azure credentials)
 * Tier 3: Azure OpenAI GPT-4.1 (generates examples when APIs don't have enough)
 */

import 'dotenv/config';

const WORDNIK_API = 'https://api.wordnik.com/v4/word.json';
const WORDNIK_KEY = process.env.WORDNIK_API_KEY;

// Azure Translator Dictionary Examples API (reuses existing Azure credentials)
const AZURE_DICT_API = 'https://api.cognitive.microsofttranslator.com/dictionary/examples';
const AZURE_KEY = process.env.AZURE_TRANSLATOR_KEY;
const AZURE_REGION = process.env.AZURE_TRANSLATOR_REGION || 'eastus';

// Azure OpenAI API for generating examples with GPT-4.1
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1';

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
 * Fetch examples from Azure Translator Dictionary Examples API
 * @param {string} word - The word to look up
 * @param {Array} definitions - Definitions array containing Chinese translations
 * @param {number} limit - Maximum number of examples to return
 * @returns {Promise<Array<{en: string, zh: string}>>} - Examples with bilingual sentences
 */
export async function fetchExamplesFromAzureDict(word, definitions = [], limit = 5) {
  if (!AZURE_KEY || definitions.length === 0) return [];

  // Get Chinese translation from first definition
  const chineseTranslation = definitions[0]?.meaningZh;
  if (!chineseTranslation) return [];

  // Extract first word/phrase from Chinese translation (before punctuation or space)
  const firstChineseWord = chineseTranslation.split(/[,;，；\s]/)[0].trim();
  if (!firstChineseWord) return [];

  try {
    const response = await fetch(
      `${AZURE_DICT_API}?api-version=3.0&from=en&to=zh-Hans`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_KEY,
          'Ocp-Apim-Subscription-Region': AZURE_REGION,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{ Text: word, Translation: firstChineseWord }])
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const examples = data[0]?.examples || [];

    // Transform API response to our format
    return examples.slice(0, limit).map(ex => ({
      en: (ex.sourcePrefix + ex.sourceTerm + ex.sourceSuffix).trim(),
      zh: (ex.targetPrefix + ex.targetTerm + ex.targetSuffix).trim()
    }));
  } catch {
    return [];
  }
}

/**
 * Generate examples using Azure OpenAI GPT-4.1
 * @param {string} word - The word to generate examples for
 * @param {Array} definitions - Definitions array for context
 * @param {number} count - Number of examples to generate
 * @returns {Promise<Array<{en: string, zh: string}>>} - Generated bilingual examples
 */
export async function fetchExamplesFromGPT(word, definitions = [], count = 3) {
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY) return [];

  // Build context from definitions
  const defContext = definitions
    .slice(0, 2)
    .map(d => `${d.partOfSpeech}: ${d.meaning}`)
    .join('; ');

  const prompt = `Generate ${count} example sentences using the English word "${word}".
Context: ${defContext || 'general usage'}

Requirements:
- Each sentence should be natural and demonstrate common usage
- Provide both English and Chinese translation
- Keep sentences concise (under 20 words)
- Use the word in different contexts/meanings if applicable

Return ONLY a JSON array in this exact format, no other text:
[{"en": "English sentence", "zh": "中文翻译"}]`;

  try {
    // Support both full URL (with /openai/deployments/) and base URL formats
    const url = AZURE_OPENAI_ENDPOINT.includes('/openai/deployments/')
      ? AZURE_OPENAI_ENDPOINT
      : `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a helpful English teacher. Return only valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) return [];

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) return [];

    // Parse JSON response
    const examples = JSON.parse(content);

    if (!Array.isArray(examples)) return [];

    return examples
      .filter(ex => ex.en && ex.zh)
      .slice(0, count)
      .map(ex => ({ en: ex.en.trim(), zh: ex.zh.trim() }));
  } catch {
    return [];
  }
}

const MIN_EXAMPLES = 3;

/**
 * Main fallback function: Tier 2a (Wordnik), Tier 2b (Azure Dictionary), Tier 3 (GPT-4.1)
 * Continues fetching from multiple sources until MIN_EXAMPLES (3) are collected
 * (Tier 1 Free Dictionary is handled in api.js before calling this)
 * @param {string} word - The word to get examples for
 * @param {Array} definitions - Definitions array (needed for Azure Dictionary and GPT)
 * @param {number} currentCount - Number of examples already collected from previous tiers
 * @returns {Promise<{examples: Array<{en: string, zh: string}>, sources: string[]}>}
 */
export async function fetchFallbackExamples(word, definitions = [], currentCount = 0) {
  const allExamples = [];
  const sources = [];
  const needed = MIN_EXAMPLES - currentCount;

  if (needed <= 0) {
    return { examples: [], sources: [] };
  }

  // Tier 2a: Try Wordnik if API key is configured
  const wordnikExamples = await fetchExamplesFromWordnik(word, needed);
  if (wordnikExamples.length > 0) {
    allExamples.push(...wordnikExamples);
    sources.push('Wordnik');
  }

  // Tier 2b: Try Azure Translator Dictionary if still need more examples
  if (allExamples.length < needed) {
    const azureLimit = needed - allExamples.length;
    const azureExamples = await fetchExamplesFromAzureDict(word, definitions, azureLimit);
    if (azureExamples.length > 0) {
      allExamples.push(...azureExamples);
      sources.push('Azure Dictionary');
    }
  }

  // Tier 3: Generate with GPT-4.1 if still need more examples
  if (allExamples.length < needed) {
    const gptLimit = needed - allExamples.length;
    const gptExamples = await fetchExamplesFromGPT(word, definitions, gptLimit);
    if (gptExamples.length > 0) {
      allExamples.push(...gptExamples);
      sources.push('GPT-4.1');
    }
  }

  return { examples: allExamples.slice(0, needed), sources };
}
