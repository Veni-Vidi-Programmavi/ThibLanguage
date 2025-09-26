// interpreter.js

import { TokenType } from './lexer.js';
import {
  BinaryExpression,
  Literal,
  Variable,
  Assignment,
  FunctionCall,
  DataObject,
  GetExpression,
  SetExpression,
} from './parser.js';
import chalk from 'chalk';

// --- Internal Representation for Data Objects ---
class ThObject {
    constructor() {
        this.properties = new Map();
    }

    get(name) {
        if (this.properties.has(name)) {
            return this.properties.get(name);
        }
        // Properties that don't exist evaluate to null
        return null;
    }

    set(name, value) {
        this.properties.set(name, value);
    }
}


// --- Built-in Function Registry ---
const builtInFunctions = {
  print: {
    execute: (callee, args) => {
      console.log(stringify(callee));
      return null;
    }
  },
  sqrt: {
    execute: (callee, args) => {
      if (typeof callee !== 'number') throw new Error("Runtime Error: 'sqrt' can only be called on a number.");
      return Math.sqrt(callee);
    }
  },
  length: {
    execute: (callee, args) => {
      if (typeof callee !== 'string') throw new Error("Runtime Error: 'length' can only be called on a string.");
      return callee.length;
    }
  },
  // --- New functions for Data Objects ---
  has: {
      execute: (callee, args) => {
          if (!(callee instanceof ThObject)) throw new Error("Runtime Error: 'has' can only be called on a data object.");
          if (args.length !== 1) throw new Error("Runtime Error: 'has' expects one argument (the key to check).");
          return callee.properties.has(args[0]);
      }
  },
  keys: {
      execute: (callee, args) => {
          if (!(callee instanceof ThObject)) throw new Error("Runtime Error: 'keys' can only be called on a data object.");
          const keys = Array.from(callee.properties.keys());
          return `[${keys.join(', ')}]`; // Return as a string representation
      }
  },
  values: {
      execute: (callee, args) => {
          if (!(callee instanceof ThObject)) throw new Error("Runtime Error: 'values' can only be called on a data object.");
          const values = Array.from(callee.properties.values()).map(v => stringify(v));
          return `[${values.join(', ')}]`; // Return as a string representation
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

  has(name) {
    return this.values.has(name);
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
    if (this.environment.has(expr.name)) {
      return this.environment.get(expr.name);
    }
    return expr.name;
  }

  visitAssignment(expr) {
      const value = this.evaluate(expr.value);
      this.environment.define(expr.name, value);
      return value;
  }

  visitSetExpression(expr) {
      const object = this.evaluate(expr.object);
      if (!(object instanceof ThObject)) {
          throw new Error("Runtime Error: Only data objects can have properties set.");
      }
      const value = this.evaluate(expr.value);
      object.set(expr.name.value, value);
      return value;
  }

  visitGetExpression(expr) {
      const object = this.evaluate(expr.object);
      if (object instanceof ThObject) {
          return object.get(expr.name.value);
      }
      throw new Error("Runtime Error: Only data objects have properties.");
  }

  visitDataObject(expr) {
      const object = new ThObject();
      for (const [key, valueExpr] of expr.properties.entries()) {
          const value = this.evaluate(valueExpr);
          object.set(key, value);
      }
      return object;
  }

  visitBinaryExpression(expr) {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.PLUS:
        if (typeof left === 'number' && typeof right === 'number') return left + right;
        if (typeof left === 'string' || typeof right === 'string') return String(left) + String(right);
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
    return null;
  }

  visitFunctionCall(expr) {
      const callee = this.evaluate(expr.callee);
      const args = expr.args.map(arg => this.evaluate(arg));

      const func = builtInFunctions[expr.functionName];
      if (func) return func.execute(callee, args);

      throw new Error(`Runtime Error: '${expr.functionName}' is not a recognized function.`);
  }
}

function stringify(value) {
    if (value === null) return "null";
    if (typeof value === 'boolean' || typeof value === 'number') return String(value);
    if (typeof value === 'string') return value;
    if (value instanceof ThObject) {
        let props = [];
        for (const [key, propValue] of value.properties.entries()) {
            props.push(`${key}: ${stringify(propValue)}`);
        }
        return `{ ${props.join(', ')} }`;
    }
    return `[Internal Object]`;
}