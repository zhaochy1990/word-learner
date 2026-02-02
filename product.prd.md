# Product Requirements Document (PRD)
## Word Learner

---

## 1. Product Overview

**Product Name**: Word Learner
**Platform**: Terminal/CLI
**Version**: 0.1.0

### Vision
A simple, terminal-based English vocabulary learning tool designed for Chinese speakers to discover, save, and learn English words efficiently.

---

## 2. Target Users

- Chinese speakers learning English
- Daily vocabulary learners
- Students

---

## 3. Features

### 3.1 Built-in Dictionaries

| Dictionary | Word Count | Description |
|------------|------------|-------------|
| COCA 20000 | 20,000 | Corpus of Contemporary American English - frequency-ranked |
| Oxford 3000 | 3,000 | Core vocabulary curated by Oxford lexicographers |

**Word Entry Data**:
- Word (English)
- Pronunciation (IPA phonetic symbols + audio playback)
- Definition (Chinese)
- Part of speech
- Example sentences (English with Chinese translation)

### 3.2 Word Search

**Description**: Search for any word across all built-in dictionaries.

**Search Behavior**:
- **Matching**: Prefix match, case-insensitive
  - Typing "exam" shows matches like "example", "examine", "examination"
  - "Hello", "hello", "HELLO" all find the same word
- **Multiple definitions**: If a word has multiple parts of speech (noun, verb, etc.), show all definitions together on one screen
- **Not found**: If word not found in local dictionaries, offer online lookup fallback

**Search History**:
- Track recently searched words
- Show recent searches for quick access when entering search

**User Flow**:
1. User selects "Search word" from main menu
2. User sees recent search history (if any)
3. User enters a word (or selects from history)
4. If prefix matches multiple words, show list to select from
5. System displays:
   - Word and all parts of speech
   - All definitions
   - Example sentences for each definition
   - Which dictionaries contain this word
6. User can save the word to notebook or go back

**Display Format - Search Results List** (when multiple matches):
```
Search: "exam"

Matches:
  1. exam
  2. examination
  3. examine
  4. example

Select [1-4] or [B] Back: _
```

**Display Format - Word Details**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
example  /ɪɡˈzæmpəl/  [P] Play audio
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[noun] 例子，实例
Examples:
  • This is an example sentence.
    这是一个例句。

[verb] 作为...的例子
Examples:
  • This exemplifies the concept.
    这例证了这个概念。

Found in: COCA 20000, Oxford 3000

[S]ave to notebook  [B]ack  or type a word to search
```

**Display Format - Not Found**:
```
"xyz" not found in local dictionaries.

[O] Search online  [B] Back
```

### 3.3 Notebook

**Description**: Save words for later learning and review.

**Data Stored per Word**:
- Word (English)
- Pronunciation (IPA)
- Definition (Chinese)
- Example sentences (English + Chinese translation)
- Date added
- Source dictionary

**Organization**: Single flat list

**Operations**:
- Save word to notebook (from search results)
- View all saved words
- Remove word from notebook

### 3.4 REPL Interface

**Description**: Claude Code-style command-line interface with persistent input prompt.

**Slash Commands**:
| Command | Alias | Description |
|---------|-------|-------------|
| `/search <word>` | `/s <word>` | Search for a word |
| `/notebook` | `/n` | View saved words |
| `/history` | - | Show recent search history |
| `/clear` | `/c` | Clear the terminal screen |
| `/help` | `/h` | Show available commands |
| `/quit` | `/q` | Exit the application |

**Direct Word Search**: Typing any word without a `/` prefix triggers a search.

**Navigation**:
- Numbered selections for list items (1, 2, 3...)
- `S` to save / `R` to remove for word actions
- `B` to return to main prompt
- `O` to search online when cache matches found
- Type any word directly to search (even while viewing word details)
- Ctrl+C to cancel current operation or exit

**Example Session**:
```
> hello
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
hello  /həˈləʊ/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[exclamation] used as a greeting
...
[S]ave to notebook  [B]ack  or type a word to search
> s
Saved "hello" to notebook
> /n
━━━ Notebook (1 words) ━━━
  1. hello - used as a greeting...
Select [1-1] or [B]ack
> b
>
```

---

## 4. User Interface

### REPL Prompt
```
Word Learner - English Vocabulary Tool
A tool for Chinese speakers to learn English

━━━ Commands ━━━
  /search <word>  or  /s <word>  - Search for a word
  /notebook       or  /n         - View notebook
  /history                       - Show search history
  /clear          or  /c         - Clear screen
  /help           or  /h         - Show this help
  /quit           or  /q         - Exit

Tip: Type any word directly to search (no command needed)

>
```

### Navigation
- Slash commands for mode switching (/search, /notebook, /help, etc.)
- Direct word input for quick search (works anywhere, even while viewing word details)
- Number keys to select from lists
- Single letter keys for actions: `s` (save), `r` (remove), `b` (back), `o` (online)
- Ctrl+C to cancel current operation or exit

---

## 5. Technical Architecture

### 5.1 Word Search Flow

```
User searches "word"
        │
        ▼
┌─────────────────────┐
│  dictionary.js      │
│  lookup(word)       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  api.js             │
│  fetchFromApi(word) │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐     Found
│  ECDICT (local)     │ ──────────► Return with Chinese + tags
│  ~760K words        │
└─────────────────────┘
          │ Not found
          ▼
┌─────────────────────┐     Found
│  Free Dictionary    │ ──────────► Return (English only)
│  API (online)       │
└─────────────────────┘
          │ Not found
          ▼
       Return null
```

### 5.2 Data Sources

| Source | Type | Words | Chinese | Exam Tags | Notes |
|--------|------|-------|---------|-----------|-------|
| ECDICT | Local (npm) | ~760K | Yes | Yes | Primary source |
| Free Dictionary API | Online | Unlimited | No | No | Fallback for rare/new words |

### 5.3 ECDICT Features

- **Chinese Translations**: Native bilingual definitions (not machine translated)
- **Exam Tags**: 中考, 高考, CET-4, CET-6, 考研, TOEFL, IELTS, GRE
- **Metadata**: Collins rating, Oxford core vocabulary flag, word frequency

### 5.4 Module Structure

```
src/
├── index.js          # Entry point
├── repl.js           # REPL interface & user interaction
├── dictionary.js     # Dictionary lookup orchestration
├── api.js            # Data source integration (ECDICT + Free Dict API)
├── ecdict.js         # ECDICT wrapper & data transformation
├── notebook.js       # User's saved words
├── commands.js       # Command parsing
└── ui.js             # Display formatting
```

### 5.5 Word Entry Data Format

```javascript
{
  word: "example",
  pronunciation: "/ɪɡˈzæmpəl/",
  definitions: [
    {
      partOfSpeech: "n",
      meaning: "English definition",
      meaningZh: "中文释义",
      examples: []
    }
  ],
  tags: ["CET-4", "高考"],      // Exam level tags
  collins: 5,                   // Collins star rating (1-5)
  oxford: true,                 // Oxford 3000 core vocabulary
  sources: ["ECDICT"]
}
```

---

## 6. Future Considerations (Not in v0.1.0)

- Quiz/review mode
- Spaced repetition learning
- Import/export word lists
- Multiple notebooks with tags
- Pronunciation audio
- Synonyms/antonyms

---

*Last updated: February 2026 - Added ECDICT integration with Chinese translations and exam tags*
