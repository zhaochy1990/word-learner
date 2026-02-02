#!/usr/bin/env node

import { WordLearnerREPL } from './src/repl.js';

const repl = new WordLearnerREPL();
repl.start();
