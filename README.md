# Custom Language

A simple, custom programming language built on Node.js that runs in your terminal.

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd custom-language
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```

## Usage

To start the interactive REPL (Read-Eval-Print Loop), run the following command:

```bash
node repl.js
```

You can then start typing commands into the terminal.

## Available Commands

The language currently supports the following commands:

- `add(a, b)`: Adds two numbers.
- `subtract(a, b)`: Subtracts the second number from the first.
- `multiply(a, b)`: Multiplies two numbers.
- `divide(a, b)`: Divides the first number by the second.
- `help`: Displays a list of available commands.
- `.exit`: Exits the REPL.

### Example

```
> add(5, 3)
8
> multiply(4, 2)
8
```