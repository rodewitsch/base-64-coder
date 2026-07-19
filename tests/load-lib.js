import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const libPath = path.resolve(__dirname, '..', 'lib.js');
const libCode = fs.readFileSync(libPath, 'utf-8');

// Remove ESLint directives that might cause issues
const cleanCode = libCode
  .replace(/\/\/ eslint-disable-next-line .*/g, '');

// Evaluate lib.js in global scope to make all functions available
// Use indirect eval to get global scope
const globalEval = (0, eval);
globalEval(cleanCode);
