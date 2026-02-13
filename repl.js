// repl.js

import readline from 'readline';
import chalk from 'chalk';
import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Interpreter } from './interpreter.js';

const interpreter = new Interpreter();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function run(source, interpreter) {
    try {
        const lexer = new Lexer(source);
        const tokens = lexer.tokenize();

        const parser = new Parser(tokens);
        const statements = parser.parse();

        const result = interpreter.interpret(statements);

        if (result !== null && result !== undefined) {
            console.log(chalk.yellow(interpreter.stringify(result)));
        }

    } catch (error) {
        console.error(chalk.red(error.message));
    }
}

function prompt() {
  rl.question(chalk.blue('> '), (line) => {
    if (line.trim().toLowerCase() === '.exit') {
      console.log(chalk.yellow('Exiting REPL.'));
      rl.close();
      return;
    }

    run(line, interpreter);
    prompt(); // Ask for the next line
  });
}

console.log(chalk.green('Welcome to the TH Language REPL!'));
console.log(chalk.gray('Type your code or ".exit" to quit.'));
prompt();