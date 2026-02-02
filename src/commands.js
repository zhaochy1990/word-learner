/**
 * Command definitions and parser for REPL interface
 */

export const COMMANDS = {
  search: {
    aliases: ['s'],
    description: 'Search for a word',
    usage: '/search <word> or /s <word>',
    requiresArgs: true
  },
  notebook: {
    aliases: ['n'],
    description: 'View saved words',
    usage: '/notebook or /n',
    requiresArgs: false
  },
  help: {
    aliases: ['h'],
    description: 'Show available commands',
    usage: '/help or /h',
    requiresArgs: false
  },
  quit: {
    aliases: ['q', 'exit'],
    description: 'Exit the application',
    usage: '/quit, /exit, or /q',
    requiresArgs: false
  },
  history: {
    aliases: [],
    description: 'Show recent search history',
    usage: '/history',
    requiresArgs: false
  },
  clear: {
    aliases: ['c'],
    description: 'Clear the screen',
    usage: '/clear or /c',
    requiresArgs: false
  },
  learn: {
    aliases: ['l'],
    description: 'Start a learning session',
    usage: '/learn or /l',
    requiresArgs: false
  }
};

// Build alias map for quick lookup
const aliasMap = new Map();
for (const [name, config] of Object.entries(COMMANDS)) {
  aliasMap.set(name, name);
  for (const alias of config.aliases) {
    aliasMap.set(alias, name);
  }
}

/**
 * Resolve command name from input (handles aliases)
 * @param {string} input - Command name or alias
 * @returns {string|null} - Canonical command name or null if not found
 */
export function resolveCommand(input) {
  return aliasMap.get(input.toLowerCase()) || null;
}

/**
 * Parse user input into structured command
 * @param {string} input - Raw user input
 * @returns {Object} - Parsed input object with type and relevant data
 */
export function parseInput(input) {
  const trimmed = input.trim();

  if (!trimmed) {
    return { type: 'empty' };
  }

  if (trimmed.startsWith('/')) {
    const parts = trimmed.slice(1).split(/\s+/);
    const cmdInput = parts[0].toLowerCase();
    const args = parts.slice(1);

    const command = resolveCommand(cmdInput);

    if (command) {
      return { type: 'command', command, args, raw: trimmed };
    }

    return { type: 'unknown_command', input: cmdInput };
  }

  // Default: treat as word search
  return { type: 'search', word: trimmed };
}
