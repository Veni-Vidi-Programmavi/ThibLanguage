// lexer.js

export const TokenType = {
  // Literals
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  BOOLEAN: 'BOOLEAN',
  IDENTIFIER: 'IDENTIFIER',

  // Operators
  EQUALS: 'EQUALS',
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  MULTIPLY: 'MULTIPLY',
  DIVIDE: 'DIVIDE',

  // Delimiters
  LPAREN: 'LPAREN', // (
  RPAREN: 'RPAREN', // )
  DOT: 'DOT',       // .
  COMMA: 'COMMA',   // ,

  // Keywords
  // (We handle boolean keywords `true` and `false` as IDENTIFIERS first, then re-classify)

  // End of File
  EOF: 'EOF',
};

const KEYWORDS = {
  'true': TokenType.BOOLEAN,
  'false': TokenType.BOOLEAN,
};

export class Lexer {
  constructor(source) {
    this.source = source;
    this.tokens = [];
    this.start = 0;
    this.current = 0;
  }

  tokenize() {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }
    this.tokens.push({ type: TokenType.EOF, value: '' });
    return this.tokens;
  }

  isAtEnd() {
    return this.current >= this.source.length;
  }

  scanToken() {
    const char = this.advance();

    switch (char) {
      case ' ':
      case '\r':
      case '\t':
      case '\n':
        // Ignore whitespace
        break;
      case '=': this.addToken(TokenType.EQUALS); break;
      case '+': this.addToken(TokenType.PLUS); break;
      case '-': this.addToken(TokenType.MINUS); break;
      case '*': this.addToken(TokenType.MULTIPLY); break;
      case '/':
        if (this.peek() === '/') {
          // A comment goes until the end of the line.
          while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance();
          }
        } else {
          this.addToken(TokenType.DIVIDE);
        }
        break;
      case '(': this.addToken(TokenType.LPAREN); break;
      case ')': this.addToken(TokenType.RPAREN); break;
      case '.': this.addToken(TokenType.DOT); break;
      case ',': this.addToken(TokenType.COMMA); break;
      case '"': this.string(); break;
      default:
        if (this.isDigit(char)) {
          this.number();
        } else if (this.isAlpha(char)) {
          this.identifier();
        } else {
          throw new Error(`Lexer Error: Unexpected character '${char}' at position ${this.current}`);
        }
    }
  }

  advance() {
    return this.source[this.current++];
  }

  peek() {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }

  addToken(type, value = null) {
    const text = this.source.substring(this.start, this.current);
    if (value === null) {
      this.tokens.push({ type, value: text });
    } else {
      this.tokens.push({ type, value });
    }
  }

  string() {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new Error("Lexer Error: Unterminated string.");
    }

    // Consume the closing "
    this.advance();

    // Get the string value without the quotes
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }

  number() {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Look for a fractional part
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      // Consume the "."
      this.advance();
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = parseFloat(this.source.substring(this.start, this.current));
    this.addToken(TokenType.NUMBER, value);
  }

  identifier() {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.start, this.current);
    const type = KEYWORDS[text] || TokenType.IDENTIFIER;

    if (type === TokenType.BOOLEAN) {
        this.addToken(type, text === 'true');
    } else {
        this.addToken(type);
    }
  }

  isDigit(char) {
    return char >= '0' && char <= '9';
  }

  isAlpha(char) {
    return (char >= 'a' && char <= 'z') ||
           (char >= 'A' && char <= 'Z') ||
           char === '_';
  }

  isAlphaNumeric(char) {
    return this.isAlpha(char) || this.isDigit(char);
  }

  peekNext() {
      if (this.current + 1 >= this.source.length) return '\0';
      return this.source[this.current + 1];
  }
}