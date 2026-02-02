/**
 * Azure Translator module
 * Translates example sentences from English to Chinese
 */

import 'dotenv/config';

const AZURE_ENDPOINT = process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com';
const AZURE_KEY = process.env.AZURE_TRANSLATOR_KEY;
const AZURE_REGION = process.env.AZURE_TRANSLATOR_REGION || 'eastus';

/**
 * Translate an array of texts from English to Chinese
 * @param {string[]} texts - Array of English texts to translate
 * @returns {Promise<string[]>} - Array of Chinese translations (empty strings on failure)
 */
export async function translateToZh(texts) {
  if (!AZURE_KEY || !texts.length) {
    return texts.map(() => '');
  }

  try {
    const response = await fetch(
      `${AZURE_ENDPOINT}/translate?api-version=3.0&to=zh-Hans`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_KEY,
          'Ocp-Apim-Subscription-Region': AZURE_REGION,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(texts.map(text => ({ Text: text })))
      }
    );

    if (!response.ok) {
      return texts.map(() => '');
    }

    const data = await response.json();
    return data.map(item => item.translations?.[0]?.text || '');
  } catch {
    return texts.map(() => '');
  }
}

export default { translateToZh };
