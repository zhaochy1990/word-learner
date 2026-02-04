/**
 * Main REPL (Read-Eval-Print Loop) interface for Word Learner
 */

import readline from 'readline';
import chalk from 'chalk';
import Dictionary from './dictionary.js';
import Notebook from './notebook.js';
import { parseInput, COMMANDS } from './commands.js';
import {
  LearningSession,
  calculateNextReview,
  getGradeFeedback,
  GRADES
} from './learn.js';
import {
  displayWordDetails,
  displayHistory,
  displayWelcome,
  displaySaved,
  displayError,
  displayHelp,
  displaySelectionPrompt,
  displayWordActions,
  displayNotebookList,
  displayLearningStats,
  displayLearnPrompt,
  displayFlashcardFront,
  displayFlashcardBack,
  displayGradeFeedback,
  displaySessionComplete,
  displayNoWordsToLearn,
  displayExtractPrompt,
  displayExtractProgress,
  displayExtractComplete,
  displayCETMenu,
  displayCETFlashcardFront,
  displayCETFlashcardBack,
  displayProgressSummary,
  displayExamples,
  displayGradePrompt
} from './ui.js';
import {
  isExtracted,
  extractWordList,
  getEstimatedCount,
  getLearningStats as getCETLearningStats,
  getWordsForLearning as getCETWordsForLearning,
  updateWordLearningState,
  getCategoryDisplayName
} from './cet.js';

// Selection states for multi-step interactions
const SelectionState = {
  NONE: null,
  WORD_ACTIONS: 'word_actions',
  NOTEBOOK_LIST: 'notebook_list',
  LEARN_MENU: 'learn_menu',
  FLASHCARD_FRONT: 'flashcard_front',
  FLASHCARD_BACK: 'flashcard_back',
  SESSION_COMPLETE: 'session_complete',
  // CET-specific states
  CET_EXTRACT_CONFIRM: 'cet_extract_confirm',
  CET_MENU: 'cet_menu',
  CET_FLASHCARD_FRONT: 'cet_flashcard_front',
  CET_FLASHCARD_BACK: 'cet_flashcard_back',
  CET_SESSION_COMPLETE: 'cet_session_complete'
};

export class WordLearnerREPL {
  constructor() {
    this.dictionary = new Dictionary();
    this.notebook = new Notebook();
    this.rl = null;
    this.pendingSelection = SelectionState.NONE;
    this.selectionData = null;
    this.learningSession = null;
    this.cetCategory = null; // Current CET category ('cet4' or 'cet6')
  }

  start() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('> '),
      historySize: 100
    });

    displayWelcome();
    this.handleProgress();
    this.rl.prompt();

    this.rl.on('line', async (line) => {
      await this.handleInput(line);
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.clear();
      console.log(chalk.dim('\nGoodbye! Happy learning!\n'));
      process.exit(0);
    });

    // Handle SIGINT (Ctrl+C)
    this.rl.on('SIGINT', () => {
      if (this.pendingSelection) {
        this.clearSelection();
        console.log();
        this.rl.prompt();
      } else {
        this.rl.close();
      }
    });
  }

  async handleInput(input) {
    // Check for pending selection state
    if (this.pendingSelection) {
      await this.handleSelection(input);
      return;
    }

    const parsed = parseInput(input);

    switch (parsed.type) {
      case 'empty':
        break;
      case 'command':
        await this.executeCommand(parsed.command, parsed.args);
        break;
      case 'search':
        await this.handleSearch(parsed.word);
        break;
      case 'unknown_command':
        displayError(`Unknown command: /${parsed.input}. Type /help for available commands.`);
        break;
    }
  }

  async executeCommand(command, args) {
    switch (command) {
      case 'search':
        if (args.length === 0) {
          displayError('Usage: /search <word>');
        } else {
          await this.handleSearch(args.join(' '));
        }
        break;
      case 'notebook':
        await this.handleNotebook();
        break;
      case 'help':
        displayHelp();
        break;
      case 'history':
        this.handleHistory();
        break;
      case 'clear':
        console.clear();
        break;
      case 'quit':
        this.rl.close();
        break;
      case 'learn':
        await this.handleLearn();
        break;
      case 'cet4':
        await this.handleCET('cet4');
        break;
      case 'cet6':
        await this.handleCET('cet6');
        break;
      case 'progress':
        this.handleProgress();
        break;
    }
  }

  async handleSearch(word) {
    try {
      console.log(chalk.dim(`\nSearching for "${word}"...`));
      const entry = await this.dictionary.lookup(word);

      if (entry) {
        this.showWordWithActions(entry);
      } else {
        console.log(chalk.yellow(`\n"${word}" not found.\n`));
      }
    } catch (error) {
      console.log(chalk.red(`\nSearch failed: ${error.message}\n`));
    }
  }

  showWordWithActions(wordEntry) {
    displayWordDetails(wordEntry);
    const inNotebook = this.notebook.hasWord(wordEntry.word);
    displayWordActions(inNotebook);
    this.pendingSelection = SelectionState.WORD_ACTIONS;
    this.selectionData = { word: wordEntry };
  }

  async handleNotebook() {
    const words = this.notebook.getWords();

    if (!displayNotebookList(words)) {
      return; // Empty notebook
    }

    displaySelectionPrompt(words.length, false);
    this.pendingSelection = SelectionState.NOTEBOOK_LIST;
    this.selectionData = { words };
  }

  handleHistory() {
    const history = this.dictionary.getHistory();
    displayHistory(history);
  }

  async handleSelection(input) {
    const trimmed = input.trim().toLowerCase();

    // Allow user to break out of selection with commands
    if (trimmed.startsWith('/')) {
      this.clearSelection();
      await this.handleInput(input);
      return;
    }

    switch (this.pendingSelection) {
      case SelectionState.WORD_ACTIONS:
        await this.handleWordActionSelection(trimmed);
        break;
      case SelectionState.NOTEBOOK_LIST:
        await this.handleNotebookListSelection(trimmed);
        break;
      case SelectionState.LEARN_MENU:
        await this.handleLearnMenuSelection(trimmed);
        break;
      case SelectionState.FLASHCARD_FRONT:
        await this.handleFlashcardFrontSelection(trimmed);
        break;
      case SelectionState.FLASHCARD_BACK:
        await this.handleFlashcardBackSelection(trimmed);
        break;
      case SelectionState.SESSION_COMPLETE:
        await this.handleSessionCompleteSelection();
        break;
      case SelectionState.CET_EXTRACT_CONFIRM:
        await this.handleCETExtractConfirm(trimmed);
        break;
      case SelectionState.CET_MENU:
        await this.handleCETMenuSelection(trimmed);
        break;
      case SelectionState.CET_FLASHCARD_FRONT:
        await this.handleCETFlashcardFrontSelection(trimmed);
        break;
      case SelectionState.CET_FLASHCARD_BACK:
        await this.handleCETFlashcardBackSelection(trimmed);
        break;
      case SelectionState.CET_SESSION_COMPLETE:
        await this.handleCETSessionCompleteSelection();
        break;
    }
  }

  async handleWordActionSelection(input) {
    const { word } = this.selectionData;

    if (input === 's') {
      if (!this.notebook.hasWord(word.word)) {
        if (this.notebook.addWord(word)) {
          displaySaved(word.word);
        } else {
          displayError('Failed to save word');
        }
      } else {
        console.log(chalk.yellow(`"${word.word}" is already in notebook`));
      }
      this.clearSelection();
      return;
    }

    if (input === 'r') {
      if (this.notebook.hasWord(word.word)) {
        if (this.notebook.removeWord(word.word)) {
          console.log(chalk.green(`Removed "${word.word}" from notebook`));
        } else {
          displayError('Failed to remove word');
        }
      } else {
        console.log(chalk.yellow(`"${word.word}" is not in notebook`));
      }
      this.clearSelection();
      return;
    }

    // Treat unrecognized input as a new word search
    this.clearSelection();
    await this.handleSearch(input);
  }

  async handleNotebookListSelection(input) {
    const { words } = this.selectionData;

    const index = parseInt(input) - 1;
    if (index >= 0 && index < words.length) {
      this.clearSelection();
      this.showWordWithActions(words[index]);
    } else {
      displayError(`Enter 1-${words.length}`);
    }
  }

  clearSelection() {
    this.pendingSelection = SelectionState.NONE;
    this.selectionData = null;
  }

  async handleLearn() {
    const words = this.notebook.getWords();

    if (words.length === 0) {
      displayNoWordsToLearn();
      return;
    }

    const stats = this.notebook.getLearningStats();
    const wordsForLearning = this.notebook.getWordsForLearning();

    displayLearningStats(stats);
    displayLearnPrompt(stats, wordsForLearning.length);

    this.pendingSelection = SelectionState.LEARN_MENU;
    this.selectionData = { wordsForLearning };
  }

  async handleLearnMenuSelection(input) {
    if (input === 's') {
      const { wordsForLearning } = this.selectionData;

      if (wordsForLearning.length === 0) {
        console.log(chalk.green('\nAll caught up! Come back later.\n'));
        this.clearSelection();
        return;
      }

      // Start learning session
      this.learningSession = new LearningSession(wordsForLearning);
      this.showCurrentFlashcard();
    } else if (input === 'b') {
      this.clearSelection();
    } else {
      console.log(chalk.dim('Press [S] to start or [B] to go back'));
    }
  }

  showCurrentFlashcard() {
    if (this.learningSession.isComplete) {
      // Session complete
      const sessionStats = this.learningSession.getStats();
      displaySessionComplete(sessionStats);
      this.pendingSelection = SelectionState.SESSION_COMPLETE;
      return;
    }

    const word = this.learningSession.currentWord;
    const { current, total } = this.learningSession.progress;

    displayFlashcardFront(word, current, total);
    this.pendingSelection = SelectionState.FLASHCARD_FRONT;
  }

  async handleFlashcardFrontSelection(input) {
    // Space or Enter reveals the answer
    if (input === '' || input === ' ') {
      this.learningSession.reveal();

      const word = this.learningSession.currentWord;
      const { current, total } = this.learningSession.progress;

      displayFlashcardBack(word, current, total);
      this.pendingSelection = SelectionState.FLASHCARD_BACK;
    } else {
      console.log(chalk.dim('Press [Space] or [Enter] to reveal'));
    }
  }

  async handleFlashcardBackSelection(input) {
    // Handle 'e' for examples
    if (input === 'e') {
      const word = this.learningSession.currentWord;
      displayExamples(word);
      displayGradePrompt();
      // Stay in FLASHCARD_BACK state
      return;
    }

    const grade = parseInt(input);

    if (grade >= GRADES.FORGOT && grade <= GRADES.EASY) {
      const word = this.learningSession.currentWord;

      // Calculate new learning state
      const newLearning = calculateNextReview(word.learning, grade);

      // Update in notebook
      this.notebook.updateWordLearning(word.word, newLearning);

      // Record grade in session
      this.learningSession.recordGrade(grade);

      // Show feedback
      const feedback = getGradeFeedback(grade, newLearning.interval);
      displayGradeFeedback(feedback, grade);

      // Small delay then show next card
      setTimeout(() => {
        this.showCurrentFlashcard();
        this.rl.prompt();
      }, 800);
    } else {
      console.log(chalk.dim('Press [E] for examples, or 1-4 to grade your recall'));
    }
  }

  async handleSessionCompleteSelection() {
    // Any key continues
    this.learningSession = null;
    this.clearSelection();
  }

  // ==================== CET Learning Handlers ====================

  /**
   * Entry point for /cet4 or /cet6 command
   * @param {string} category - 'cet4' or 'cet6'
   */
  async handleCET(category) {
    this.cetCategory = category;

    if (!isExtracted(category)) {
      // Need to extract first
      const estimatedCount = getEstimatedCount(category);
      displayExtractPrompt(category, estimatedCount);
      this.pendingSelection = SelectionState.CET_EXTRACT_CONFIRM;
      this.selectionData = { category };
    } else {
      // Word list exists, show menu
      this.showCETMenu(category);
    }
  }

  /**
   * Handle extraction confirmation
   * @param {string} input - User input
   */
  async handleCETExtractConfirm(input) {
    const { category } = this.selectionData;

    if (input === 'y' || input === 'yes') {
      console.log();
      console.log(chalk.dim('Extracting words from ECDICT...'));

      const count = extractWordList(category, displayExtractProgress);
      displayExtractComplete(category, count);

      // Show menu after extraction
      this.showCETMenu(category);
    } else if (input === 'n' || input === 'no') {
      this.clearSelection();
      this.cetCategory = null;
    } else {
      console.log(chalk.dim('Press [Y] to extract or [N] to cancel'));
    }
  }

  /**
   * Show CET learning menu
   * @param {string} category - 'cet4' or 'cet6'
   */
  showCETMenu(category) {
    const stats = getCETLearningStats(category);
    displayCETMenu(category, stats);

    this.pendingSelection = SelectionState.CET_MENU;
    this.selectionData = { category, stats };
  }

  /**
   * Handle CET menu selection
   * @param {string} input - User input
   */
  async handleCETMenuSelection(input) {
    const { category } = this.selectionData;

    if (input === 's') {
      const wordsForLearning = getCETWordsForLearning(category);

      if (wordsForLearning.length === 0) {
        console.log(chalk.green('\nAll caught up! Come back later.\n'));
        this.clearSelection();
        this.cetCategory = null;
        return;
      }

      // Start CET learning session
      this.learningSession = new LearningSession(wordsForLearning);
      this.showCETCurrentFlashcard();
    } else if (input === 'b') {
      this.clearSelection();
      this.cetCategory = null;
    } else {
      console.log(chalk.dim('Press [S] to start or [B] to go back'));
    }
  }

  /**
   * Show current CET flashcard
   */
  showCETCurrentFlashcard() {
    if (this.learningSession.isComplete) {
      // Session complete
      const sessionStats = this.learningSession.getStats();
      displaySessionComplete(sessionStats);
      this.pendingSelection = SelectionState.CET_SESSION_COMPLETE;
      return;
    }

    const word = this.learningSession.currentWord;
    const { current, total } = this.learningSession.progress;

    displayCETFlashcardFront(word, current, total);
    this.pendingSelection = SelectionState.CET_FLASHCARD_FRONT;
  }

  /**
   * Handle CET flashcard front selection (reveal)
   * @param {string} input - User input
   */
  async handleCETFlashcardFrontSelection(input) {
    // Space or Enter reveals the answer
    if (input === '' || input === ' ') {
      this.learningSession.reveal();

      const word = this.learningSession.currentWord;
      const { current, total } = this.learningSession.progress;

      displayCETFlashcardBack(word, current, total);
      this.pendingSelection = SelectionState.CET_FLASHCARD_BACK;
    } else {
      console.log(chalk.dim('Press [Space] or [Enter] to reveal'));
    }
  }

  /**
   * Handle CET flashcard back selection (grading)
   * @param {string} input - User input
   */
  async handleCETFlashcardBackSelection(input) {
    // Handle 'e' for examples
    if (input === 'e') {
      const word = this.learningSession.currentWord;
      displayExamples(word);
      displayGradePrompt();
      // Stay in CET_FLASHCARD_BACK state
      return;
    }

    const grade = parseInt(input);

    if (grade >= GRADES.FORGOT && grade <= GRADES.EASY) {
      const word = this.learningSession.currentWord;

      // Calculate new learning state
      const newLearning = calculateNextReview(word.learning, grade);

      // Update in CET progress file
      updateWordLearningState(this.cetCategory, word.word, newLearning);

      // Record grade in session
      this.learningSession.recordGrade(grade);

      // Show feedback
      const feedback = getGradeFeedback(grade, newLearning.interval);
      displayGradeFeedback(feedback, grade);

      // Small delay then show next card
      setTimeout(() => {
        this.showCETCurrentFlashcard();
        this.rl.prompt();
      }, 800);
    } else {
      console.log(chalk.dim('Press [E] for examples, or 1-4 to grade your recall'));
    }
  }

  /**
   * Handle CET session complete
   */
  async handleCETSessionCompleteSelection() {
    // Any key continues
    this.learningSession = null;
    this.cetCategory = null;
    this.clearSelection();
  }

  /**
   * Handle /progress command - display unified learning statistics
   */
  handleProgress() {
    const notebookStats = this.notebook.getLearningStats();
    const cet4Stats = isExtracted('cet4') ? getCETLearningStats('cet4') : null;
    const cet6Stats = isExtracted('cet6') ? getCETLearningStats('cet6') : null;

    displayProgressSummary(notebookStats, cet4Stats, cet6Stats);
  }
}
