// interpreter.js

import { TokenType } from './lexer.js';
import {
  BinaryExpression,
  Literal,
  Variable,
  Assignment,
  FunctionCall,
} from './parser.js';
import chalk from 'chalk';

// --- Built-in Function Registry ---
// To add a new function, just add an entry to this object.
const builtInFunctions = {
  log: {
    // The 'callee' is the value the function is called on (e.g., 'hello' in "hello".print())
    execute: (callee, args) => {
      console.log(stringify(callee));
      return null; // print returns nothing
    }
  },
  sqrt: {
    execute: (callee, args) => {
      if (typeof callee !== 'number') {
        throw new Error("Runtime Error: The 'sqrt' function can only be called on a number.");
      }
      return Math.sqrt(callee);
    }
  },
  length: {
    execute: (callee, args) => {
      if (typeof callee !== 'string') {
        throw new Error("Runtime Error: The 'length' function can only be called on a string.");
      }
      return callee.length;
    }
  },
  random: {
    execute: (callee, args) => {
      if (typeof callee !== 'int') {
        throw new Error("Runtime Error: The 'random' function can only be called on a number.");
      }
      return Math.floor(Math.random() * (args.max - args.min + 1)) + min;
    }
  }
};


class Environment {
  constructor() {
    this.values = new Map();
  }

  define(name, value) {
    this.values.set(name, value);
  }

  get(name) {
    if (this.values.has(name)) {
      return this.values.get(name);
    }
    throw new Error(`Runtime Error: Undefined variable '${name}'.`);
  }
}

export class Interpreter {
  constructor() {
    this.environment = new Environment();
  }

  interpret(statements) {
    let lastValue = null;
    try {
      for (const statement of statements) {
        lastValue = this.evaluate(statement);
      }
    } catch (error) {
      console.error(chalk.red(error.message));
    }
    return lastValue;
  }

  evaluate(expr) {
    // This is the visitor pattern. We call the appropriate visit method based on the node's type.
    const visitorMethod = `visit${expr.constructor.name}`;
    if (this[visitorMethod]) {
      return this[visitorMethod](expr);
    }
    throw new Error(`Interpreter Error: No visitor method found for ${expr.constructor.name}`);
  }

  visitLiteral(expr) {
    return expr.value;
  }

  visitVariable(expr) {
    return this.environment.get(expr.name);
  }

  visitAssignment(expr) {
      const value = this.evaluate(expr.value);
      this.environment.define(expr.name, value);
      return value;
  }

  visitBinaryExpression(expr) {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.PLUS:
        if (typeof left === 'number' && typeof right === 'number') {
          return left + right;
        }
        if (typeof left === 'string' || typeof right === 'string') {
          return String(left) + String(right);
        }
        throw new Error('Runtime Error: Operands for + must be two numbers or at least one string.');
      case TokenType.MINUS:
         if (typeof left === 'number' && typeof right === 'number') return left - right;
        throw new Error('Runtime Error: Operands for - must be numbers.');
      case TokenType.MULTIPLY:
         if (typeof left === 'number' && typeof right === 'number') return left * right;
        throw new Error('Runtime Error: Operands for * must be numbers.');
      case TokenType.DIVIDE:
         if (typeof left === 'number' && typeof right === 'number') {
            if (right === 0) throw new Error('Runtime Error: Division by zero.');
            return left / right;
        }
        throw new Error('Runtime Error: Operands for / must be numbers.');
    }
    return null; // Unreachable
  }

  visitFunctionCall(expr) {
      const callee = this.evaluate(expr.callee);
      const args = expr.args.map(arg => this.evaluate(arg));

      const func = builtInFunctions[expr.functionName];

      if (func) {
          return func.execute(callee, args);
      }

      throw new Error(`Runtime Error: '${expr.functionName}' is not a recognized function.`);
  }
}

// Helper to display values in the REPL or console
function stringify(value) {
    if (value === null) return "null";
    if (typeof value === 'boolean' || typeof value === 'number') return String(value);
    if (typeof value === 'string') return value; // Strings are already strings
    return `[Internal Object]`;
}
