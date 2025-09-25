// index.js

import fs from 'fs';
import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Interpreter } from './interpreter.js';
import chalk from 'chalk';

function main() {
  const args = process.argv.slice(2);

  if (args.length !== 1) {
    console.log(chalk.red('Usage: node index.js <file.th>'));
    process.exit(1);
  }

  const filePath = args[0];
  if (!filePath.endsWith('.th')) {
    console.log(chalk.red('Error: File must have a .th extension.'));
    process.exit(1);
  }

  runFile(filePath);
}

function runFile(filePath) {
  try {
    const source = fs.readFileSync(filePath, 'utf-8');
    run(source);
  } catch (error) {
    console.error(chalk.red(`Error reading file: ${filePath}`));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

function run(source) {
    try {
        const lexer = new Lexer(source);
        const tokens = lexer.tokenize();

        const parser = new Parser(tokens);
        const statements = parser.parse();

        // If there was a syntax error, stop.
        if (statements.some(s => s === null)) { // A bit of a simplification
            console.error(chalk.red("Syntax error detected. Halting execution."));
            return;
        }

        const interpreter = new Interpreter();
        interpreter.interpret(statements);

    } catch (error) {
        console.error(chalk.red(error.message));
        process.exit(1);
    }
}


main();