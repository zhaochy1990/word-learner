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
    // Show part of speech and Chinese meaning (preferred)
    const meaning = def.meaningZh || def.meaning || '';
    console.log(chalk.green(`[${def.partOfSpeech}] `) + chalk.white(meaning));

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
  console.log(chalk.white('  /learn          ') + chalk.dim('or') + chalk.white('  /l         ') + chalk.dim('- Start learning (Notebook, CET-4, CET-6)'));
  console.log(chalk.white('  /progress       ') + chalk.dim('or') + chalk.white('  /p         ') + chalk.dim('- View learning progress'));
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

  // Display examples automatically
  displayExamples(wordEntry);

  console.log(chalk.white('How well did you remember?'));
  console.log(chalk.red('[1] Forgot') + '  ' +
              chalk.yellow('[2] Hard') + '  ' +
              chalk.green('[3] Good') + '  ' +
              chalk.cyan('[4] Easy'));
}

/**
 * Display examples for a word entry
 * @param {Object} wordEntry - Word entry with definitions containing examples
 */
export function displayExamples(wordEntry) {
  console.log();
  console.log(chalk.cyan('━━━ Examples ━━━'));
  let hasExamples = false;

  for (const def of wordEntry.definitions) {
    if (def.examples && def.examples.length > 0) {
      hasExamples = true;
      console.log(chalk.green(`[${def.partOfSpeech}]`));
      for (const example of def.examples) {
        if (typeof example === 'string') {
          console.log(chalk.white(`  • ${example}`));
        } else {
          console.log(chalk.white(`  • ${example.en}`));
          if (example.zh) {
            console.log(chalk.gray(`    ${example.zh}`));
          }
        }
      }
      console.log();
    }
  }

  if (!hasExamples) {
    console.log(chalk.dim('No examples available for this word.'));
    console.log();
  }
}

/**
 * Display the grade prompt
 */
export function displayGradePrompt() {
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

/**
 * Display course selection menu for /learn command
 * @param {number} notebookCount - Number of words in notebook
 * @param {boolean} cet4Available - Whether CET-4 word list is extracted
 * @param {boolean} cet6Available - Whether CET-6 word list is extracted
 */
export function displayLearnCourseMenu(notebookCount, cet4Available, cet6Available) {
  console.log();
  console.log(chalk.cyan('━━━ Select Course ━━━'));
  console.log();

  // Option 1: Notebook
  const notebookStatus = notebookCount > 0
    ? chalk.dim(` (${notebookCount} words)`)
    : chalk.dim(' (empty)');
  console.log(chalk.white('  [1] My Notebook') + notebookStatus);

  // Option 2: CET-4
  const cet4Status = cet4Available
    ? chalk.dim(' (ready)')
    : chalk.dim(' (not extracted)');
  console.log(chalk.white('  [2] CET-4 Vocabulary') + cet4Status);

  // Option 3: CET-6
  const cet6Status = cet6Available
    ? chalk.dim(' (ready)')
    : chalk.dim(' (not extracted)');
  console.log(chalk.white('  [3] CET-6 Vocabulary') + cet6Status);

  console.log();
  console.log(chalk.cyan('[1-3] Select  [B]ack'));
}

// ==================== CET Learning UI ====================

/**
 * Display extraction confirmation prompt
 * @param {string} category - 'cet4' or 'cet6'
 * @param {number} estimatedCount - Estimated word count
 */
export function displayExtractPrompt(category, estimatedCount) {
  const displayName = category.toUpperCase();
  console.log();
  console.log(chalk.yellow(`${displayName} word list not found.`));
  console.log(chalk.white(`Extract from ECDICT? (~${estimatedCount.toLocaleString()} words)`));
  console.log();
  console.log(chalk.cyan('[Y]es  [N]o'));
}

/**
 * Display extraction progress
 * @param {number} current - Current progress
 * @param {number} total - Total entries
 */
export function displayExtractProgress(current, total) {
  const percent = Math.round((current / total) * 100);
  process.stdout.write(`\r${chalk.dim(`Processing ECDICT... ${percent}%`)}`);
}

/**
 * Display extraction complete message
 * @param {string} category - 'cet4' or 'cet6'
 * @param {number} count - Number of words extracted
 */
export function displayExtractComplete(category, count) {
  console.log(); // Clear the progress line
  console.log(chalk.green(`Extracted ${count.toLocaleString()} ${category.toUpperCase()} words`));
  console.log();
}

/**
 * Display CET learning menu with statistics
 * @param {string} category - 'cet4' or 'cet6'
 * @param {Object} stats - Statistics from getLearningStats()
 */
export function displayCETMenu(category, stats) {
  const displayName = category.toUpperCase();
  console.log();
  console.log(chalk.cyan(`━━━ ${displayName} Learning ━━━`));
  console.log(chalk.white(`Total: ${stats.total.toLocaleString()}`) + '  ' +
              chalk.gray(`New: ${stats.newAvailable.toLocaleString()}`) + '  ' +
              chalk.green(`Mastered: ${stats.mastered}`));
  console.log(chalk.white(`Due today: ${stats.dueToday}`));
  console.log();

  // Display bar chart for each level (compact version)
  const maxBarLength = 15;
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
  console.log(chalk.cyan('[S]tart session  [B]ack'));
}

/**
 * Display CET flashcard front (word only, with Collins/Oxford info)
 * @param {Object} wordEntry - Word entry with learning state
 * @param {number} current - Current word number
 * @param {number} total - Total words in session
 */
export function displayCETFlashcardFront(wordEntry, current, total) {
  console.log();
  console.log(chalk.cyan(`━━━ Word ${current} of ${total} ━━━`));
  console.log();
  console.log(chalk.bold.white(`  ${wordEntry.word}`));
  console.log(chalk.yellow(`  ${wordEntry.pronunciation || ''}`));
  console.log();
  console.log(chalk.dim('Press [Space] to reveal answer'));
}

/**
 * Display CET flashcard back (word with definitions and metadata)
 * @param {Object} wordEntry - Word entry
 * @param {number} current - Current word number
 * @param {number} total - Total words in session
 */
export function displayCETFlashcardBack(wordEntry, current, total) {
  console.log();
  console.log(chalk.cyan(`━━━ Word ${current} of ${total} ━━━`));
  console.log(chalk.bold.white(`${wordEntry.word}  `) + chalk.yellow(wordEntry.pronunciation || ''));

  // Show Collins and Oxford badges
  const badges = [];
  if (wordEntry.collins > 0) {
    badges.push(chalk.magenta(`Collins: ${'★'.repeat(wordEntry.collins)}`));
  }
  if (wordEntry.oxford) {
    badges.push(chalk.blue('Oxford 3000'));
  }
  if (badges.length > 0) {
    console.log(badges.join('  '));
  }

  console.log(chalk.cyan('─'.repeat(40)));

  for (const def of wordEntry.definitions) {
    const meaning = def.meaningZh || def.meaning || '';
    console.log(chalk.green(`[${def.partOfSpeech}] `) + chalk.white(meaning));
  }

  // Display examples automatically
  displayExamples(wordEntry);

  console.log(chalk.white('How well did you remember?'));
  console.log(chalk.red('[1] Forgot') + '  ' +
              chalk.yellow('[2] Hard') + '  ' +
              chalk.green('[3] Good') + '  ' +
              chalk.cyan('[4] Easy'));
}

// ==================== Progress Summary UI ====================

/**
 * Display category statistics with level bar chart
 * @param {string} name - Category display name
 * @param {Object} stats - Statistics object with total, byLevel, dueToday
 */
function displayCategoryStats(name, stats) {
  console.log(chalk.cyan(`─── ${name} ───`));
  console.log(chalk.white(`Total: ${stats.total}`) + '  ' +
              chalk.green(`Mastered: ${stats.byLevel[5]}`) + '  ' +
              chalk.yellow(`Due: ${stats.dueToday}`));

  // Compact level bar chart
  const maxBarLength = 12;
  const maxCount = Math.max(...stats.byLevel, 1);
  const levelColors = [chalk.gray, chalk.red, chalk.yellow, chalk.blue, chalk.cyan, chalk.green];

  for (let level = 0; level < 6; level++) {
    const count = stats.byLevel[level];
    const barLength = Math.round((count / maxCount) * maxBarLength);
    const bar = '█'.repeat(barLength);
    const levelName = LEVEL_NAMES[level].padEnd(10);
    console.log(levelColors[level](`  ${levelName} ${bar} ${count}`));
  }
  console.log();
}

/**
 * Display unified learning progress summary across all data sources
 * @param {Object} notebookStats - Statistics from notebook.getLearningStats()
 * @param {Object|null} cet4Stats - Statistics from getCETLearningStats('cet4') or null
 * @param {Object|null} cet6Stats - Statistics from getCETLearningStats('cet6') or null
 */
export function displayProgressSummary(notebookStats, cet4Stats, cet6Stats) {
  console.log();
  console.log(chalk.cyan('━━━ Learning Progress Summary ━━━'));
  console.log();

  // Calculate totals
  const total = notebookStats.total + (cet4Stats?.total || 0) + (cet6Stats?.total || 0);
  const mastered = notebookStats.byLevel[5] + (cet4Stats?.byLevel[5] || 0) + (cet6Stats?.byLevel[5] || 0);
  const newWords = notebookStats.byLevel[0] + (cet4Stats?.byLevel[0] || 0) + (cet6Stats?.byLevel[0] || 0);
  const inProgress = total - mastered - newWords;
  const masteredPercent = total > 0 ? Math.round((mastered / total) * 100) : 0;

  // Overall stats
  console.log(chalk.white.bold('Overall Progress'));
  console.log(chalk.white(`  Total words: ${total.toLocaleString()}`));
  console.log(chalk.green(`  Mastered: ${mastered.toLocaleString()} (${masteredPercent}%)`));
  console.log(chalk.yellow(`  In progress: ${inProgress.toLocaleString()}`));
  console.log(chalk.gray(`  New: ${newWords.toLocaleString()}`));
  console.log();

  // Mastery progress bar
  const barLength = 30;
  const filled = Math.round((masteredPercent / 100) * barLength);
  const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(barLength - filled));
  console.log(`  Mastery: [${bar}] ${masteredPercent}%`);
  console.log();

  // Category breakdown
  displayCategoryStats('Notebook', notebookStats);
  if (cet4Stats) displayCategoryStats('CET-4', cet4Stats);
  if (cet6Stats) displayCategoryStats('CET-6', cet6Stats);

  // Due today summary
  const totalDue = notebookStats.dueToday + (cet4Stats?.dueToday || 0) + (cet6Stats?.dueToday || 0);
  console.log(chalk.cyan('─── Due Today ───'));
  if (totalDue === 0) {
    console.log(chalk.green('All caught up! No words due for review.'));
  } else {
    console.log(chalk.white(`Total due: ${totalDue} words`));
    if (notebookStats.dueToday > 0) console.log(chalk.dim(`  Notebook: ${notebookStats.dueToday}`));
    if (cet4Stats?.dueToday > 0) console.log(chalk.dim(`  CET-4: ${cet4Stats.dueToday}`));
    if (cet6Stats?.dueToday > 0) console.log(chalk.dim(`  CET-6: ${cet6Stats.dueToday}`));
  }
  console.log();
}
