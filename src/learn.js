/**
 * Learning module with SM-2 spaced repetition algorithm
 */

// Default learning state for new words
export const DEFAULT_LEARNING = {
  level: 0,           // 0=new, 1=learning, 2=reviewing, 3=familiar, 4=confident, 5=mastered
  easeFactor: 2.5,    // SM-2 multiplier (min 1.3)
  interval: 0,        // days until next review
  lastReviewedAt: null,
  nextReviewAt: null,
  reviewCount: 0,
  correctCount: 0
};

// Level thresholds based on interval
const LEVEL_THRESHOLDS = [
  { minInterval: 21, level: 5, name: 'Mastered' },
  { minInterval: 14, level: 4, name: 'Confident' },
  { minInterval: 7, level: 3, name: 'Familiar' },
  { minInterval: 1, level: 2, name: 'Reviewing' },
  { minInterval: 0, level: 1, name: 'Learning' }
];

export const LEVEL_NAMES = ['New', 'Learning', 'Reviewing', 'Familiar', 'Confident', 'Mastered'];

// Grade options
export const GRADES = {
  FORGOT: 1,
  HARD: 2,
  GOOD: 3,
  EASY: 4
};

/**
 * Calculate new level based on interval
 * @param {number} interval - Current interval in days
 * @returns {number} - Level 0-5
 */
export function calculateLevel(interval) {
  for (const threshold of LEVEL_THRESHOLDS) {
    if (interval >= threshold.minInterval) {
      return threshold.level;
    }
  }
  return 0; // New
}

/**
 * SM-2 algorithm: calculate next review based on grade
 * @param {Object} learning - Current learning state
 * @param {number} grade - User grade (1-4)
 * @returns {Object} - Updated learning state
 */
export function calculateNextReview(learning, grade) {
  const now = new Date();
  let { easeFactor, interval, reviewCount, correctCount } = learning;

  reviewCount++;

  if (grade === GRADES.FORGOT) {
    // Reset: word was forgotten
    interval = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    // Successful recall
    correctCount++;

    if (interval === 0) {
      // First success
      interval = 1;
    } else if (interval === 1) {
      // Second success
      interval = 6;
    } else {
      // Subsequent successes
      interval = Math.round(interval * easeFactor);
    }

    // Adjust ease factor based on grade
    if (grade === GRADES.HARD) {
      easeFactor = Math.max(1.3, easeFactor - 0.15);
    } else if (grade === GRADES.EASY) {
      easeFactor = easeFactor + 0.15;
    }
    // GOOD keeps ease factor unchanged
  }

  const level = calculateLevel(interval);
  const nextReviewAt = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000).toISOString();

  return {
    level,
    easeFactor,
    interval,
    lastReviewedAt: now.toISOString(),
    nextReviewAt,
    reviewCount,
    correctCount
  };
}

/**
 * Get feedback message based on grade and interval
 * @param {number} grade - User grade (1-4)
 * @param {number} interval - New interval in days
 * @returns {string} - Feedback message
 */
export function getGradeFeedback(grade, interval) {
  const messages = {
    [GRADES.FORGOT]: "No problem! We'll review this again soon.",
    [GRADES.HARD]: `Got it. Next review in ${formatInterval(interval)}.`,
    [GRADES.GOOD]: `Nice! Next review in ${formatInterval(interval)}.`,
    [GRADES.EASY]: `Excellent! Next review in ${formatInterval(interval)}.`
  };
  return messages[grade];
}

/**
 * Format interval for display
 * @param {number} days - Interval in days
 * @returns {string} - Formatted string
 */
function formatInterval(days) {
  if (days === 0) return 'today';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 14) return '1 week';
  if (days < 21) return '2 weeks';
  if (days < 30) return '3 weeks';
  if (days < 60) return '1 month';
  return `${Math.round(days / 30)} months`;
}

/**
 * Learning session manager
 */
export class LearningSession {
  constructor(words) {
    this.words = words;
    this.currentIndex = 0;
    this.results = [];
    this.revealed = false;
  }

  get totalWords() {
    return this.words.length;
  }

  get currentWord() {
    return this.words[this.currentIndex] || null;
  }

  get isComplete() {
    return this.currentIndex >= this.words.length;
  }

  get progress() {
    return {
      current: this.currentIndex + 1,
      total: this.words.length,
      reviewed: this.results.length,
      correct: this.results.filter(r => r.grade >= GRADES.GOOD).length
    };
  }

  reveal() {
    this.revealed = true;
  }

  recordGrade(grade) {
    this.results.push({
      word: this.currentWord.word,
      grade,
      wasRevealed: this.revealed
    });
    this.currentIndex++;
    this.revealed = false;
  }

  getStats() {
    const correct = this.results.filter(r => r.grade >= GRADES.GOOD).length;
    const needPractice = this.results.filter(r => r.grade < GRADES.GOOD).length;
    return {
      reviewed: this.results.length,
      correct,
      needPractice,
      percentage: this.results.length > 0
        ? Math.round((correct / this.results.length) * 100)
        : 0
    };
  }
}
