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
    // Use lookahead to determine if we are parsing an assignment.
    if (this.peek().type === TokenType.IDENTIFIER && this.tokens[this.current + 1].type === TokenType.EQUALS) {
      return this.assignmentStatement();
    }
    return this.expressionStatement();
  }

  assignmentStatement() {
      const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");
      this.consume(TokenType.EQUALS, "Expect '=' after variable name.");
      const value = this.expression();
      return new Assignment(name.value, value);
  }

  expressionStatement() {
    const expr = this.expression();
    return expr;
  }

  expression() {
    return this.term();
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

    while (this.match(TokenType.DOT)) {
        const name = this.consume(TokenType.IDENTIFIER, "Expect function name after '.'.");
        this.consume(TokenType.LPAREN, "Expect '(' after function name.");
        const args = [];
        if (!this.check(TokenType.RPAREN)) {
            do {
                args.push(this.expression());
            } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RPAREN, "Expect ')' after arguments.");
        expr = new FunctionCall(expr, name.value, args);
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

    throw new Error(`Parser Error: Unexpected token: ${this.peek().type}`);
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