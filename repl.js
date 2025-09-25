const repl = require('repl');
const chalk = require('chalk');
const { execute } = require('./index');

console.log(chalk.green('Welcome to the Custom Language REPL!'));
console.log(chalk.gray('Type your commands, or ".exit" to quit.'));

const r = repl.start({
  prompt: chalk.blue('> '),
  eval: (cmd, context, filename, callback) => {
    if (cmd.trim() === '.exit') {
        console.log(chalk.yellow('Exiting REPL.'));
        process.exit();
    }
    const result = execute(cmd);
    callback(null, result);
  }
});