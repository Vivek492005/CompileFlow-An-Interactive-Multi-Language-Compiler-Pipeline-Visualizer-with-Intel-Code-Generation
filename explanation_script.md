# CompileFlow: Project Explanation Script

## 1. Project Overview & Working
**CompileFlow** is an interactive, web-based compiler visualization platform designed to demystify the complex process of compiling high-level programming languages. It bridge the gap between human-readable source code and machine-executable assembly.

The project works by taking a **C-like source code** entry from the user and passing it through a strictly defined pipeline of transformation phases. Each phase represents a classic stage of compiler design, providing a real-time data visualization of how the code is morphed from a string of characters into optimized machine-level instructions.

### Core Workflow:
1. **Input**: User enters code into the Source Editor.
2. **Process**: The "Compile & Analyze" engine triggers a sequential 7-stage pipeline.
3. **Visualization**: Each stage's output (Tokens, AST, Symbol Table, TAC, etc.) is rendered in a dedicated UI panel for analysis.
4. **Output**: The final result is functional **Intel 8085 Assembly Code**.

---

## 2. Tech Stack Used
The project is built using a modern, high-performance web stack to ensure a smooth, interactive experience:

*   **Frontend Library**: **React.js** (via **Vite**) – Used for building the modular UI components and managing the application state (active phases, compilation results).
*   **Compiler Engine**: **Vanilla JavaScript (ES6+)** – The entire "engine" (Lexer, Parser, Optimizer, etc.) is implemented in pure JS for maximum portability and speed.
*   **Styling**: **Modern CSS (with Modules)** – A "Premium Dark" aesthetic is achieved using CSS variables, glassmorphism effects, and custom animations to make the visualization feel professional.
*   **Icons & Assets**: **Lucide React** & Custom SVG paths for pipeline stage indicators.

---

## 3. The 7 Stages of Compilation

This compiler implements a robust "Frontend and Backend" architecture, broken down into the following seven stages:

### Stage 1: Lexical Analysis (Scanner)
*   **Theory**: This is the first phase where the source code (a long string of characters) is scanned and broken into meaningful sequences called **Tokens**. It uses a **DFA (Deterministic Finite Automata)** approach to recognize patterns.
*   **In Research**: The `lexer(code)` function identifies keywords (`int`, `if`), identifiers (`a`, `myVar`), operators (`+`, `==`), and constants (`10`, `"hello"`). It also strips out whitespace and comments.

### Stage 2: Syntax Analysis (Parser)
*   **Theory**: This phase takes the stream of tokens and checks if they follow the grammatical rules of the language. It builds a hierarchical structure called an **Abstract Syntax Tree (AST)**.
*   **In Research**: We use a **Recursive Descent Parser**. It recursively navigates through tokens to build a tree where each node represents a language construct (e.g., a "For Loop" node containing "Init", "Check", and "Body" children).

### Stage 3: Semantic Analysis
*   **Theory**: The "Logic Check" phase. It ensures that the syntax makes sense in context. For example, it checks if you're trying to add a string to an integer or use a variable before it’s declared.
*   **In Research**: The `analyzeSemantics(ast)` function validates scope levels and checks for type compatibility across the AST nodes.

### Stage 4: Symbol Table Management
*   **Theory**: Often called the "Heart of the Compiler," the Symbol Table is a data structure used to store information about all identifiers (variables, functions). It tracks their names, types, scope levels, and memory addresses.
*   **In Research**: As variables are declared, they are "pushed" to the Symbol Table stack. This stage calculates **memory offsets** (e.g., 4 bytes for `int`, 8 bytes for `double`) to prepare for actual hardware memory mapping.

### Stage 5: Intermediate Code Generation (ICG)
*   **Theory**: The compiler converts the AST into a machine-independent intermediate form. This is usually **Three-Address Code (TAC)**, which looks like simplified assembly.
*   **In Research**: The `generateICG(ast)` function produces **Quadruples** — a 4-tuple format `(operator, argument1, argument2, result)`. This makes it easier to optimize the code before hitting the target hardware.

### Stage 6: Code Optimization
*   **Theory**: This phase attempts to improve the intermediate code so that it runs faster or uses less memory.
*   **In Research**: The project implements **Constant Folding** (calculating `2 + 3` as `5` at compile-time) and **Dead Code Elimination** (removing variables that are never used). This reduces the number of instructions the processor has to execute.

### Stage 7: Target Code Generation
*   **Theory**: The final phase where the optimized intermediate code is translated into the actual language of the target machine.
*   **In Research**: The `generateASM(quads)` function maps the intermediate quadruples to **Intel 8085 Assembly Instructions**. It handles register allocation (using the `A` and `B` registers) and implements operations like `LDA` (Load), `STA` (Store), and `ADI` (Add Immediate).

---

## 4. Conclusion
By following these 7 stages, **CompileFlow** provides a complete architectural overview of how modern compilers work, transforming human logic into low-level machine instructions through a series of elegant, mathematical transformations.
