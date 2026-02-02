import chalk from 'chalk';
import { LEVEL_NAMES, GRADES } from './learn.js';

const LINE = '━'.repeat(50);

export function displayWordDetails(wordEntry) {
  console.log();
  console.log(chalk.cyan(LINE));
  console.log(chalk.bold.white(`${wordEntry.word}  `) + chalk.yellow(wordEntry.pronunciation || ''));

  // Display exam tags if available
  if (wordEntry.tags && wordEntry.tags.length > 0) {
    const tagStr = wordEntry.tags.map(t => chalk.blue(`[${t}]`)).join(' ');
    console.log(tagStr);
  }

  console.log(chalk.cyan(LINE));
  console.log();

  for (const def of wordEntry.definitions) {
    // Show part of speech and meaning
    const meaning = def.meaningZh || def.meaning || '';
    console.log(chalk.green(`[${def.partOfSpeech}] `) + chalk.white(meaning));

    // If we have English meaning but also want to show it separately
    if (def.meaningZh && def.meaning && def.meaningZh !== def.meaning) {
      console.log(chalk.gray(`  ${def.meaning}`));
    }

    if (def.examples && def.examples.length > 0) {
      console.log(chalk.dim('Examples:'));
      for (const example of def.examples) {
        // Handle both formats: {en, zh} or just string
        if (typeof example === 'string') {
          console.log(chalk.white(`  • ${example}`));
        } else {
          console.log(chalk.white(`  • ${example.en}`));
          if (example.zh) {
            console.log(chalk.gray(`    ${example.zh}`));
          }
        }
      }
    }
    console.log();
  }

  if (wordEntry.sources && wordEntry.sources.length > 0) {
    console.log(chalk.dim(`Source: ${wordEntry.sources.join(', ')}`));
  }
  console.log();
}

export function displaySearchResults(results) {
  console.log();
  console.log(chalk.cyan('Matches:'));
  results.forEach((result, index) => {
    console.log(chalk.white(`  ${index + 1}. ${result.word}`));
  });
  console.log();
}

export function displayHistory(history) {
  if (history.length === 0) return;

  console.log();
  console.log(chalk.dim('Recent searches:'));
  history.slice(0, 5).forEach((word, index) => {
    console.log(chalk.gray(`  ${index + 1}. ${word}`));
  });
  console.log();
}

export function displayNotFound(query) {
  console.log();
  console.log(chalk.yellow(`"${query}" not found in local dictionaries.`));
  console.log();
}

export function displayWelcome() {
  console.log();
  console.log(chalk.bold.cyan('Word Learner - English Vocabulary Tool'));
  console.log(chalk.dim('A tool for Chinese speakers to learn English'));
  console.log();
}

export function displayMainMenu(cacheSize = 0) {
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.white('  1. Search word'));
  console.log(chalk.white('  2. View notebook'));
  console.log(chalk.white('  3. Exit'));
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  if (cacheSize > 0) {
    console.log(chalk.dim(`  Cached words: ${cacheSize}`));
  }
  console.log();
}

export function displaySaved(word) {
  console.log(chalk.green(`✓ Saved "${word}" to notebook`));
}

export function displayError(message) {
  console.log(chalk.red(`Error: ${message}`));
}

export function displayHelp() {
  console.log();
  console.log(chalk.cyan('━━━ Commands ━━━'));
  console.log(chalk.white('  /search <word>  ') + chalk.dim('or') + chalk.white('  /s <word>  ') + chalk.dim('- Search for a word'));
  console.log(chalk.white('  /notebook       ') + chalk.dim('or') + chalk.white('  /n         ') + chalk.dim('- View notebook'));
  console.log(chalk.white('  /learn          ') + chalk.dim('or') + chalk.white('  /l         ') + chalk.dim('- Start learning session'));
  console.log(chalk.white('  /history                     ') + chalk.dim('- Show search history'));
  console.log(chalk.white('  /clear          ') + chalk.dim('or') + chalk.white('  /c         ') + chalk.dim('- Clear screen'));
  console.log(chalk.white('  /help           ') + chalk.dim('or') + chalk.white('  /h         ') + chalk.dim('- Show this help'));
  console.log(chalk.white('  /exit           ') + chalk.dim('or') + chalk.white('  /q         ') + chalk.dim('- Exit'));
  console.log();
  console.log(chalk.dim('Tip: Type any word directly to search (no command needed)'));
  console.log();
}

export function displaySelectionPrompt(count, showOnline = false) {
  if (showOnline) {
    console.log(chalk.cyan(`Select [1-${count}] or [O]nline search`));
  } else {
    console.log(chalk.cyan(`Select [1-${count}]`));
  }
}

export function displayWordActions(inNotebook) {
  if (inNotebook) {
    console.log(chalk.cyan('[R]emove from notebook'));
  } else {
    console.log(chalk.cyan('[S]ave to notebook'));
  }
}

export function displayNotebookList(words) {
  if (words.length === 0) {
    console.log(chalk.yellow('\nYour notebook is empty. Search and save some words!\n'));
    return false;
  }

  console.log(chalk.cyan(`\n━━━ Notebook (${words.length} words) ━━━`));
  words.forEach((w, i) => {
    // Prefer Chinese translation for preview
    const preview = (w.definitions[0]?.meaningZh || w.definitions[0]?.meaning || '').substring(0, 40);
    console.log(chalk.white(`  ${i + 1}. ${w.word}`) + chalk.dim(` - ${preview}...`));
  });
  console.log();
  return true;
}

/**
 * Display learning statistics with progress bars
 * @param {Object} stats - Statistics object from notebook.getLearningStats()
 */
export function displayLearningStats(stats) {
  console.log();
  console.log(chalk.cyan('━━━ Learning Statistics ━━━'));
  console.log(chalk.white(`Total words: ${stats.total}`));
  console.log();

  // Display bar chart for each level
  const maxBarLength = 20;
  const maxCount = Math.max(...stats.byLevel, 1);

  const levelColors = [
    chalk.gray,      // 0: New
    chalk.red,       // 1: Learning
    chalk.yellow,    // 2: Reviewing
    chalk.blue,      // 3: Familiar
    chalk.cyan,      // 4: Confident
    chalk.green      // 5: Mastered
  ];

  for (let level = 0; level < 6; level++) {
    const count = stats.byLevel[level];
    const barLength = Math.round((count / maxCount) * maxBarLength);
    const bar = '█'.repeat(barLength);
    const levelName = LEVEL_NAMES[level].padEnd(10);
    const colorFn = levelColors[level];

    console.log(colorFn(`  ${levelName} ${bar} ${count}`));
  }

  console.log();
}

/**
 * Display the learning session prompt
 * @param {Object} stats - Statistics from notebook.getLearningStats()
 * @param {number} wordsForSession - Number of words ready for this session
 */
export function displayLearnPrompt(stats, wordsForSession) {
  console.log(chalk.white(`Due for review today: ${stats.dueToday}`));
  console.log();

  if (wordsForSession === 0) {
    console.log(chalk.green('All caught up! No words due for review.'));
    if (stats.newAvailable > 0) {
      console.log(chalk.dim(`${stats.newAvailable} new words available to start learning.`));
    }
  } else {
    console.log(chalk.white('Ready to learn:'));
    if (stats.dueToday > 0) {
      console.log(chalk.dim(`  ${stats.dueToday} words due for review`));
    }
    if (stats.newAvailable > 0) {
      console.log(chalk.dim(`  ${stats.newAvailable} new words available`));
    }
  }

  console.log();
  console.log(chalk.cyan('[S]tart session  [B]ack'));
}

/**
 * Display flashcard front (word only)
 * @param {Object} wordEntry - Word entry
 * @param {number} current - Current word number
 * @param {number} total - Total words in session
 */
export function displayFlashcardFront(wordEntry, current, total) {
  console.log();
  console.log(chalk.cyan(`━━━ Word ${current} of ${total} ━━━`));
  console.log();
  console.log(chalk.bold.white(`  ${wordEntry.word}`));
  console.log(chalk.yellow(`  ${wordEntry.pronunciation || ''}`));
  console.log();
  console.log(chalk.dim('Press [Space] to reveal answer'));
}

/**
 * Display flashcard back (word with definitions)
 * @param {Object} wordEntry - Word entry
 * @param {number} current - Current word number
 * @param {number} total - Total words in session
 */
export function displayFlashcardBack(wordEntry, current, total) {
  console.log();
  console.log(chalk.cyan(`━━━ Word ${current} of ${total} ━━━`));
  console.log(chalk.bold.white(`${wordEntry.word}  `) + chalk.yellow(wordEntry.pronunciation || ''));
  console.log(chalk.cyan('─'.repeat(40)));

  for (const def of wordEntry.definitions) {
    const meaning = def.meaningZh || def.meaning || '';
    console.log(chalk.green(`[${def.partOfSpeech}] `) + chalk.white(meaning));
  }

  console.log();
  console.log(chalk.white('How well did you remember?'));
  console.log(chalk.red('[1] Forgot') + '  ' +
              chalk.yellow('[2] Hard') + '  ' +
              chalk.green('[3] Good') + '  ' +
              chalk.cyan('[4] Easy'));
}

/**
 * Display grade feedback
 * @param {string} feedback - Feedback message
 * @param {number} grade - User's grade
 */
export function displayGradeFeedback(feedback, grade) {
  const colors = {
    [GRADES.FORGOT]: chalk.red,
    [GRADES.HARD]: chalk.yellow,
    [GRADES.GOOD]: chalk.green,
    [GRADES.EASY]: chalk.cyan
  };
  const colorFn = colors[grade] || chalk.white;
  console.log();
  console.log(colorFn(feedback));
}

/**
 * Display session complete summary
 * @param {Object} sessionStats - Stats from LearningSession.getStats()
 */
export function displaySessionComplete(sessionStats) {
  console.log();
  console.log(chalk.cyan('━━━ Session Complete ━━━'));
  console.log(chalk.white(`Reviewed: ${sessionStats.reviewed} words`));
  console.log(chalk.green(`Correct: ${sessionStats.correct} (${sessionStats.percentage}%)`));
  if (sessionStats.needPractice > 0) {
    console.log(chalk.yellow(`Need practice: ${sessionStats.needPractice}`));
  }
  console.log();
  console.log(chalk.dim('Press any key to continue'));
}

/**
 * Display empty notebook message for learning
 */
export function displayNoWordsToLearn() {
  console.log();
  console.log(chalk.yellow('No words to learn yet!'));
  console.log(chalk.dim('Search for words and save them to your notebook first.'));
  console.log();
}
