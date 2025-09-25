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
    if (expr instanceof BinaryExpression) {
      return this.visitBinaryExpression(expr);
    }
    if (expr instanceof Literal) {
      return this.visitLiteral(expr);
    }
    if (expr instanceof Variable) {
      return this.visitVariable(expr);
    }
    if (expr instanceof Assignment) {
      return this.visitAssignment(expr);
    }
    if (expr instanceof FunctionCall) {
      return this.visitFunctionCall(expr);
    }
    throw new Error('Interpreter Error: Unknown AST node.');
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
        // Allow string concatenation
        if (typeof left === 'string' || typeof right === 'string') {
            return String(left) + String(right);
        }
        throw new Error('Runtime Error: Operands must be two numbers or at least one string for +.');
      case TokenType.MINUS:
         if (typeof left === 'number' && typeof right === 'number') {
            return left - right;
        }
        throw new Error('Runtime Error: Operands must be numbers for -.');
      case TokenType.MULTIPLY:
         if (typeof left === 'number' && typeof right === 'number') {
            return left * right;
        }
        throw new Error('Runtime Error: Operands must be numbers for *.');
      case TokenType.DIVIDE:
         if (typeof left === 'number' && typeof right === 'number') {
            if (right === 0) {
                throw new Error('Runtime Error: Division by zero.');
            }
            return left / right;
        }
        throw new Error('Runtime Error: Operands must be numbers for /.');
    }

    // Unreachable
    return null;
  }

  visitFunctionCall(expr) {
      const callee = this.evaluate(expr.callee);
      const args = expr.args.map(arg => this.evaluate(arg));

      // For now, we only handle a built-in 'print' function
      if (expr.functionName === 'print') {
          // The 'print' function logs the object it's called on.
          console.log(this.stringify(callee));
          return null; // print returns nothing
      }

      throw new Error(`Runtime Error: '${expr.functionName}' is not a function.`);
  }

  stringify(value) {
      if (value === null) return "null";
      if (typeof value === 'boolean') return String(value);
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return String(value);
      return `[Internal Object]`;
  }
}