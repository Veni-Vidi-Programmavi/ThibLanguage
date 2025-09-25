const chalk = require('chalk');

const execute = (command) => {
  command = command.trim();

  // Basic arithmetic operations
  const addRegex = /add\((.*),\s*(.*)\)/;
  const subRegex = /subtract\((.*),\s*(.*)\)/;
  const mulRegex = /multiply\((.*),\s*(.*)\)/;
  const divRegex = /divide\((.*),\s*(.*)\)/;

  let match;

  if (match = command.match(addRegex)) {
    const [, a, b] = match;
    const result = parseFloat(a) + parseFloat(b);
    return chalk.yellow(result);
  } else if (match = command.match(subRegex)) {
    const [, a, b] = match;
    const result = parseFloat(a) - parseFloat(b);
    return chalk.yellow(result);
  } else if (match = command.match(mulRegex)) {
    const [, a, b] = match;
    const result = parseFloat(a) * parseFloat(b);
    return chalk.yellow(result);
  } else if (match = command.match(divRegex)) {
    const [, a, b] = match;
    if (parseFloat(b) === 0) {
      return chalk.red('Error: Division by zero');
    }
    const result = parseFloat(a) / parseFloat(b);
    return chalk.yellow(result);
  } else if (command === 'help') {
    return chalk.cyan(
      'Available commands:\n' +
      '  add(a, b)\n' +
      '  subtract(a, b)\n' +
      '  multiply(a, b)\n' +
      '  divide(a, b)\n' +
      '  help\n' +
      '  .exit'
    );
  } else {
    return chalk.red(`Unknown command: "${command}"`);
  }
};

module.exports = { execute };