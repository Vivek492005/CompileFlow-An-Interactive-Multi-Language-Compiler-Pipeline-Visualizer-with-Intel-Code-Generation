# Phase 1: Lexical Analyzer (Scanner)

## 1. Definition & Theory
The **Lexical Analyzer**, or **Scanner**, is the first phase of a compiler. Its primary job is to read the source code as a stream of characters and group them into meaningful units called **Tokens**.

In this project, the Lexical Analyzer is implemented using a **DFA (Deterministic Finite Automata) approach**. It scans the input string and transitions between states based on the characters it encounters (e.g., transition to a "Number" state if a digit is found).

---

## 2. Implementation in `engine.js`
The core logic resides in the `lexer(code)` function.

### **A. Token Categories**
The lexer categorizes source code into the following types:
- **KEYWORD**: Reserved words like `int`, `while`, `if`, `return`.
- **IDENTIFIER**: User-defined names for variables and functions (e.g., `main`, `counter`).
- **INT_CONST / FLOAT_CONST**: Numeric literals.
- **STRING / CHAR_LITERAL**: Textual data enclosed in quotes.
- **OPERATOR**: Symbols like `+`, `-`, `*`, `/`, `==`, `&&`.
- **PUNCTUATION**: Structural symbols like `(`, `)`, `{`, `}`, `;`.

### **B. Key Logic Snippets**

#### **Multi-Character Operator Recognition**
To prevent the lexer from misidentifying `==` as two separate `=` tokens, it uses a lookahead strategy:
```javascript
const multiCharOps = ['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '->'];

for (let op of multiCharOps) {
    if (code.substr(i, op.length) === op) {
        tokens.push({ type: 'OPERATOR', lexeme: op, line, col });
        i += op.length; 
        col += op.length;
        isOp = true; 
        break;
    }
}
```

#### **Identifier & Keyword Distinction**
The lexer first captures a word, then checks against a list of reserved keywords:
```javascript
if (/[a-zA-Z_]/.test(char)) {
    let word = '';
    while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
        word += code[i]; i++; col++;
    }
    tokens.push({
        type: keywords.includes(word) ? 'KEYWORD' : 'IDENTIFIER',
        lexeme: word, line, col: startCol
    });
}
```

---

## 3. Error Handling
If the lexer encounters a character that does not match any valid token pattern (e.g., `@` or `$`), it throws a `CompilerError` with the exact line and column number:
```javascript
throw new CompilerError(`Unrecognized character: ${char}`, line, col);
```

---

## 4. Output Example
**Input**: `int a = 10;`
**Output Tokens**:
1. `{ type: 'KEYWORD', lexeme: 'int' }`
2. `{ type: 'IDENTIFIER', lexeme: 'a' }`
3. `{ type: 'OPERATOR', lexeme: '=' }`
4. `{ type: 'INT_CONST', lexeme: '10' }`
5. `{ type: 'PUNCTUATION', lexeme: ';' }`
