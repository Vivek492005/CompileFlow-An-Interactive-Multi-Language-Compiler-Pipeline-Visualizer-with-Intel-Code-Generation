# Deep Technical Analysis: `engine.js` Internal Logic

This document provides a line-by-line and logic-based deep dive into the `engine.js` file, which serves as the core "brain" of the CompileFlow compiler.

---

## 1. Lexical Analyzer (`lexer` function)

The Lexical Analyzer is the first entry point. It converts the raw string input into a structured array of **Tokens**.

### **Implementation Strategy**

- **DFA-like Loop**: The code iterates through the input string index-by-index (`while (i < code.length)`).
- **Token Identification**:
  - **Keywords & Identifiers**: Uses `[a-zA-Z_]` regex. It first captures a word and then checks if it's in the `keywords` array (`int`, `float`, `if`, etc.).
  - **Numeric Literals**: Captures digits and handles decimals (`hasDot`) to distinguish between `INT_CONST` and `FLOAT_CONST`.
  - **String & Char Literals**: Handles quoted text, including basic escape sequence support for characters.
- **Operator Processing**:
  - It prioritizing **Multi-char Operators** (e.g., `==`, `!=`, `++`) over single-char operators to avoid misidentifying `==` as two `=` tokens.
- **Handling Metadata**: Every token object tracks its `line` and `col` numbering to provide precise error reporting.

---

## 2. Syntax Analyzer (`Parser` class)

The Parser transforms the flat token list into a hierarchical **Abstract Syntax Tree (AST)** using the **Recursive Descent** pattern.

### **Key Components**

- **Lookahead Mechanism**: `peek()` and `match()` methods allow the parser to "look" at upcoming tokens without consuming them, enabling decision-making (e.g., deciding if a statement is a variable declaration or an assignment).
- **Operator Precedence (LL Parsing)**:
  Precedence is handled by the calling structure of methods:
  1. `parseExpression()` calls `parseLogical()`
  2. `parseLogical()` calls `parseRelational()`
  3. `parseRelational()` calls `parseAdditive()`
  4. `parseAdditive()` calls `parseTerm()`
  5. `parseTerm()` calls `parseFactor()`
     This ensures that `*` (Term) is processed before `+` (Additive).

- **AST Node Structure**:
  Every node is a JavaScript object:
  ```javascript
  {
    name: "Assign",
    id: "x",
    expr: { ... },
    children: [ ... ]
  }
  ```

---

## 3. Semantic Analyzer (`analyzeSemantics` function)

This stage ensures the program is logically sound, even if the syntax is correct.

### **Symbol Table & Scope Stack**

- **`symbolMapStack`**: An array of Maps representing the scope levels. When the parser enters a `{` (Block), a new Map is pushed. When it leaves `}`, the Map is popped.
- **Variable Validation**:
  - **Detection of Redeclaration**: Checks if a variable name already exists in the _current_ scope's Map.
  - **Detection of Undeclared Usage**: Recursively searches from the current scope Map up to the global Map to find a variable's declaration.
- **Memory Mapping**:
  - Calculates storage requirements: `double/long` (8 bytes), `int/float` (4 bytes), `char/bool` (1 byte).
  - Assigns a virtual memory address (e.g., `0x2000`) for the Target Code stage.

---

## 4. Intermediate Code Generator (`generateICG`)

Generates **Three-Address Code (TAC)** represented as **Quadruples**.

### **Quadruple Format**

Each instruction follows the format: `(op, arg1, arg2, result)`.

- **Temp Variables**: Uses a `newTemp()` generator to create intermediate storage (`t1`, `t2`, etc.) for complex expressions like `a + b * c`.
- **Labels**: Uses `newLabel()` to create jump targets for control flow (If, While, For).
- **Control Flow Logic**:
  - For a `While` loop, it emits a `label` at the start, an `ifFalse` jump to the end if the condition fails, and a `goto` back to the start label at the end of the block.

---

## 5. Code Optimization (`optimize`)

The optimizer performs multiple passes over the Quadruples to streamline the logic.

### **Optimization Techniques**

1.  **Constant Folding**: If a quadruple has two numeric arguments (e.g., `+ 10 20 t1`), the optimizer evaluates it at compile-time and replaces it with an assignment (`= 30 '' t1`).
2.  **Constant Propagation**: If `x = 10`, then every subsequent use of `x` is replaced with the literal `10` until `x` is redefined.
3.  **Dead Code Elimination (DCE)**:
    - The optimizer builds a "Used Set" of all variables involved in `print`, `if` conditions, or assignments to non-temporary variables.
    - Any temporary variable (`t1`, `t2`) that is assigned a value but never used in a subsequent operation is deleted from the instruction stream.

---

## 6. Target Code Generation (`generateASM`)

The final stage translates the optimized quadruples into **Intel 8085 Assembly**.

### **Mapping Logic**

- **Register Allocation**: Uses the Accumulator (`A`) for the primary operand and the `B` register for the secondary operand.
- **Instruction Mapping**:
  - `+` (Add) becomes `ADD B` or `ADI` (Add Immediate).
  - `-` (Sub) becomes `SUB B` or `SUI`.
  - `=` (Assign) becomes `STA` (Store Accumulator).
  - `print` becomes `OUT 01H` (Output to port 1).
- **Subroutine Simulation**: Since 8085 lacks hardware multiplication/division, it emits `CALL MULT` or `CALL DIV` to simulated subroutines.

---

## 7. Master Function (`compileAll`)

This function orchestrates the entire pipeline. It acts as the "Linker" that passes the output of one phase as the input to the next:

```javascript
const tokens = lexer(code);
const ast = parser.parse();
const semantics = analyzeSemantics(ast);
const icg = generateICG(ast);
const opt = optimize(icg.quads);
const asm = generateASM(opt.quads);
```

The resulting object contains the full trace of the compilation, which is then used by the React components to render the UI checkboxes and data tables.
