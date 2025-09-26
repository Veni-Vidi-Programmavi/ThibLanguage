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
  BlockStatement,
  ForEachStatement,
} from './parser.js';
import chalk from 'chalk';

// --- Internal Representations ---
class ThObject {
    constructor() {
        this.properties = new Map();
    }
    get(name) {
        if (this.properties.has(name)) return this.properties.get(name);
        return null;
    }
    set(name, value) {
        this.properties.set(name, value);
    }
}

class ThList {
    constructor() {
        this.items = [];
    }
    add(item) {
        this.items.push(item);
    }
    replace(oldValue, newValue) {
        const index = this.items.findIndex(item => item === oldValue);
        if (index !== -1) {
            this.items[index] = newValue;
        }
    }
}

// --- Built-in Function Registry ---
const builtInFunctions = {
  log: { execute: (callee, args) => { console.log(stringify(callee)); return null; } },
  sqrt: { execute: (callee, args) => { if (typeof callee !== 'number') throw new Error("Runtime Error: 'sqrt' can only be called on a number."); return Math.sqrt(callee); } },
  length: { execute: (callee, args) => { if (typeof callee !== 'string') throw new Error("Runtime Error: 'length' can only be called on a string."); return callee.length; } },
  has: { execute: (callee, args) => { if (!(callee instanceof ThObject)) throw new Error("Runtime Error: 'has' can only be called on a data object."); if (args.length !== 1) throw new Error("Runtime Error: 'has' expects one argument (the key to check)."); return callee.properties.has(args[0]); } },
  keys: { execute: (callee, args) => { if (!(callee instanceof ThObject)) throw new Error("Runtime Error: 'keys' can only be called on a data object."); const keys = Array.from(callee.properties.keys()); return `[${keys.join(', ')}]`; } },
  values: { execute: (callee, args) => { if (!(callee instanceof ThObject)) throw new Error("Runtime Error: 'values' can only be called on a data object."); const values = Array.from(callee.properties.values()).map(v => stringify(v)); return `[${values.join(', ')}]`; } },
  add: { execute: (callee, args) => { if (!(callee instanceof ThList)) throw new Error("Runtime Error: 'add' can only be called on a database/list."); if (args.length !== 1) throw new Error("Runtime Error: 'add' expects one argument."); callee.add(args[0]); return null; } },
  replace: { execute: (callee, args) => { if (!(callee instanceof ThList)) throw new Error("Runtime Error: 'replace' can only be called on a database/list."); if (args.length !== 2) throw new Error("Runtime Error: 'replace' expects two arguments (oldValue, newValue)."); callee.replace(args[0], args[1]); return null; } },
};

// --- Environment for Scoping ---
class Environment {
  constructor(enclosing = null) {
    this.values = new Map();
    this.enclosing = enclosing;
  }
  define(name, value) { this.values.set(name, value); }
  get(name) {
    if (this.values.has(name)) return this.values.get(name);
    if (this.enclosing) return this.enclosing.get(name);
    throw new Error(`Runtime Error: Undefined variable '${name}'.`);
  }
  has(name) {
    if (this.values.has(name)) return true;
    if (this.enclosing) return this.enclosing.has(name);
    return false;
  }
}

export class Interpreter {
  constructor() {
    this.environment = new Environment();
    // Define global 'data' object
    this.environment.define('data', new ThObject());
  }

  interpret(statements) {
    try {
      for (const statement of statements) {
        this.evaluate(statement);
      }
    } catch (error) {
      console.error(chalk.red(error.message));
    }
  }

  executeBlock(statements, environment) {
      const previous = this.environment;
      try {
          this.environment = environment;
          for (const statement of statements) {
              this.evaluate(statement);
          }
      } finally {
          this.environment = previous;
      }
  }

  evaluate(expr) {
    const visitorMethod = `visit${expr.constructor.name}`;
    if (this[visitorMethod]) return this[visitorMethod](expr);
    throw new Error(`Interpreter Error: No visitor method for ${expr.constructor.name}`);
  }

  visitBlockStatement(stmt) {
      this.executeBlock(stmt.statements, new Environment(this.environment));
      return null;
  }

  visitForEachStatement(stmt) {
      const collection = this.evaluate(stmt.collection);
      if (!(collection instanceof ThList)) throw new Error("Runtime Error: Can only iterate over a database/list.");
      for (const item of collection.items) {
          const loopEnvironment = new Environment(this.environment);
          loopEnvironment.define(stmt.variable.value, item);
          this.executeBlock(stmt.body.statements, loopEnvironment);
      }
      return null;
  }

  visitLiteral(expr) { return expr.value; }
  visitVariable(expr) {
    if (this.environment.has(expr.name)) return this.environment.get(expr.name);
    return expr.name;
  }
  visitAssignment(expr) { this.environment.define(expr.name, this.evaluate(expr.value)); }
  visitSetExpression(expr) {
      const object = this.evaluate(expr.object);
      if (!(object instanceof ThObject)) throw new Error("Runtime Error: Only data objects can have properties set.");
      const value = this.evaluate(expr.value);
      object.set(expr.name.value, value);
      return value;
  }
  visitGetExpression(expr) {
      const object = this.evaluate(expr.object);
      if (object instanceof ThObject) return object.get(expr.name.value);
      throw new Error("Runtime Error: Only data objects have properties.");
  }
  visitDataObject(expr) {
      const object = new ThObject();
      for (const [key, valueExpr] of expr.properties.entries()) {
          object.set(key, this.evaluate(valueExpr));
      }
      return object;
  }
  visitBinaryExpression(expr) {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);
    switch (expr.operator.type) {
      case TokenType.PLUS: if (typeof left === 'number' && typeof right === 'number') return left + right; if (typeof left === 'string' || typeof right === 'string') return String(left) + String(right); throw new Error('Runtime Error: Invalid operands for +.');
      case TokenType.MINUS: if (typeof left === 'number' && typeof right === 'number') return left - right; throw new Error('Runtime Error: Operands for - must be numbers.');
      case TokenType.MULTIPLY: if (typeof left === 'number' && typeof right === 'number') return left * right; throw new Error('Runtime Error: Operands for * must be numbers.');
      case TokenType.DIVIDE: if (typeof left === 'number' && typeof right === 'number') { if (right === 0) throw new Error('Runtime Error: Division by zero.'); return left / right; } throw new Error('Runtime Error: Operands for / must be numbers.');
    }
  }
  visitFunctionCall(expr) {
      const callee = this.evaluate(expr.callee);
      const args = expr.args.map(arg => this.evaluate(arg));
      if (expr.functionName === 'create' && callee === this.environment.get('data')) {
          if (args.length !== 1 || typeof args[0] !== 'string') throw new Error("Runtime Error: 'create' expects one string argument for the database name.");
          const dbName = args[0];
          if (callee.properties.has(dbName)) throw new Error(`Runtime Error: Database '${dbName}' already exists.`);
          callee.set(dbName, new ThList());
          return null;
      }
      const func = builtInFunctions[expr.functionName];
      if (func) return func.execute(callee, args);
      throw new Error(`Runtime Error: '${expr.functionName}' is not a recognized function.`);
  }
}

function stringify(value) {
    if (value === null) return "null";
    if (typeof value === 'boolean' || typeof value === 'number') return String(value);
    if (typeof value === 'string') return value;
    if (value instanceof ThList) {
        const items = value.items.map(item => stringify(item));
        return `[${items.join(', ')}]`;
    }
    if (value instanceof ThObject) {
        let props = [];
        for (const [key, propValue] of value.properties.entries()) {
            props.push(`${key}: ${stringify(propValue)}`);
        }
        return `{ ${props.join(', ')} }`;
    }
    return `[Internal Object]`;
}
