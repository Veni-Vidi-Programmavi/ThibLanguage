// parser.js

import { TokenType } from './lexer.js';

// --- AST Node Definitions ---
export class BinaryExpression {
  constructor(left, operator, right) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }
}

export class Literal {
  constructor(value) {
    this.value = value;
  }
}

export class Variable {
  constructor(name) {
    this.name = name;
  }
}

export class Assignment {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }
}

export class FunctionCall {
  constructor(callee, functionName, args) {
    this.callee = callee;
    this.functionName = functionName;
    this.args = args;
  }
}

export class DataObject {
    constructor(properties) {
        this.properties = properties;
    }
}

export class GetExpression {
    constructor(object, name) {
        this.object = object;
        this.name = name;
    }
}

export class SetExpression {
    constructor(object, name, value) {
        this.object = object;
        this.name = name;
        this.value = value;
    }
}

export class IndexExpression {
    constructor(collection, index) {
        this.collection = collection;
        this.index = index;
    }
}

// --- AST Nodes for Statements ---

export class BlockStatement {
    constructor(statements) {
        this.statements = statements;
    }
}

export class ForEachStatement {
    constructor(variable, collection, body) {
        this.variable = variable;
        this.collection = collection;
        this.body = body;
    }
}


export class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
  }

  parse() {
    const statements = [];
    while (!this.isAtEnd()) {
      statements.push(this.statement());
    }
    return statements;
  }

  statement() {
      if (this.match(TokenType.FOREACH)) {
          return this.forEachStatement();
      }
      if (this.match(TokenType.LBRACE)) {
          return new BlockStatement(this.block());
      }
      return this.expressionStatement();
  }

  forEachStatement() {
      this.consume(TokenType.LPAREN, "Expect '(' after 'forEach'.");
      const collection = this.expression();
      this.consume(TokenType.COMMA, "Expect ',' separating collection and variable.");
      const variable = this.consume(TokenType.IDENTIFIER, "Expect loop variable name.");
      this.consume(TokenType.RPAREN, "Expect ')' after forEach clause.");

      const body = this.statement();

      return new ForEachStatement(variable, collection, body);
  }

  block() {
      const statements = [];
      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
          statements.push(this.statement());
      }
      this.consume(TokenType.RBRACE, "Expect '}' after block.");
      return statements;
  }

  expressionStatement() {
    return this.expression();
  }

  expression() {
    return this.assignment();
  }

  assignment() {
      const expr = this.term();

      if (this.match(TokenType.EQUALS)) {
          const value = this.assignment();

          if (expr instanceof Variable) {
              return new Assignment(expr.name, value);
          } else if (expr instanceof GetExpression) {
              return new SetExpression(expr.object, expr.name, value);
          }

          throw new Error("Parser Error: Invalid assignment target.");
      }

      return expr;
  }

  term() {
    let expr = this.factor();
    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = new BinaryExpression(expr, operator, right);
    }
    return expr;
  }

  factor() {
    let expr = this.call();
    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE)) {
      const operator = this.previous();
      const right = this.call();
      expr = new BinaryExpression(expr, operator, right);
    }
    return expr;
  }

  call() {
    let expr = this.primary();
    while (true) {
        if (this.match(TokenType.DOT)) {
            if (this.match(TokenType.LBRACKET)) {
                const index = this.expression();
                this.consume(TokenType.RBRACKET, "Expect ']' after index expression.");
                expr = new IndexExpression(expr, index);
            } else {
                const name = this.consume(TokenType.IDENTIFIER, "Expect property or method name after '.'.");
                if (this.match(TokenType.LPAREN)) {
                    const args = [];
                    if (!this.check(TokenType.RPAREN)) {
                        do {
                            args.push(this.expression());
                        } while (this.match(TokenType.COMMA));
                    }
                    this.consume(TokenType.RPAREN, "Expect ')' after arguments.");
                    expr = new FunctionCall(expr, name.value, args);
                } else {
                    expr = new GetExpression(expr, name);
                }
            }
        } else {
            break;
        }
    }
    return expr;
  }

  primary() {
    if (this.match(TokenType.NUMBER, TokenType.STRING, TokenType.BOOLEAN)) {
      return new Literal(this.previous().value);
    }
    if (this.match(TokenType.IDENTIFIER)) {
        return new Variable(this.previous().value);
    }
    if (this.match(TokenType.LPAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RPAREN, "Expect ')' after expression.");
      return expr;
    }
    if (this.match(TokenType.LBRACE)) {
        return this.dataObjectLiteral();
    }
    throw new Error(`Parser Error: Unexpected token: ${this.peek().type}`);
  }

  dataObjectLiteral() {
      const properties = new Map();
      if (!this.check(TokenType.RBRACE)) {
          do {
              const key = this.consume(TokenType.IDENTIFIER, "Expect property name.");
              this.consume(TokenType.COLON, "Expect ':' after property name.");
              const value = this.expression();
              properties.set(key.value, value);
          } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RBRACE, "Expect '}' after data object properties.");
      return new DataObject(properties);
  }

  // --- Helper Methods ---
  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }

  peek() {
    return this.tokens[this.current];
  }

  previous() {
    return this.tokens[this.current - 1];
  }

  consume(type, message) {
    if (this.check(type)) return this.advance();
    throw new Error(`Parser Error: ${message} (got ${this.peek().type})`);
  }
}