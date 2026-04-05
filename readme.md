# CompileFlow

### An Interactive Multi-Language Compiler Pipeline Visualizer with Intel 8085 Target Code Generation

> **A production-grade compiler simulator that transforms high-level source code into Intel 8085 assembly — visualizing every stage of the compilation pipeline in real time.**

CompileFlow is a full-stack compiler visualization tool built with React and Vite. It provides a real-time, visual walkthrough of all six classical stages of compilation, supporting **C**, **C++**, and **Python** out of the box.

---

## ✨ Features at a Glance

| Feature | Details |
|---|---|
| **Multi-Language Support** | C, C++, and Python engines with language-specific lexers, parsers, and semantic analyzers |
| **6-Stage Pipeline** | Lexical → Syntax → Semantic → ICG → Optimization → Target Code |
| **Error-Tolerant Parsing** | Graceful recovery from syntax errors — the compiler never crashes on unknown constructs |
| **DFA / NFA Diagrams** | Auto-generated Mermaid state diagrams for each language's lexical automaton |
| **Intel 8085 Assembly** | Full target code generation with register allocation (A, B, C, D, H, L) and memory mapping |
| **Animated Pipeline** | Phase-by-phase progress indicators with real-time status feedback |
| **Dark-Themed UI** | Premium glassmorphism design with CSS Modules — no utility frameworks |
| **Desktop App** | Optional Electron wrapper for native desktop deployment |

---

## 🏗️ The Compiler Pipeline

### 1. Lexical Analysis (DFA-based Scanner)
- **Engine:** Deterministic Finite Automata (DFA) per language.
- **Capabilities:** Tokenizes source code into Keywords, Identifiers, Operators, Literals (int, float, char, string), Preprocessor Directives, and Punctuation.
- **Error Handling:** Real-time detection of unrecognized characters with line/column reporting.
- **Visualizations:** Auto-generated DFA & NFA state diagrams via Mermaid.

### 2. Syntax Analysis (Recursive Descent Parser)
- **Parser:** Top-down Recursive Descent with error recovery (`sync()` on failure).
- **C Support:** Functions, structs, pointers, arrays, `for`/`while`/`do-while`, `if`/`else`, `switch`, `goto`/labels, `printf`/`scanf`, multi-variable declarations.
- **C++ Support:** Classes with access specifiers (`public`, `private`, `protected`), constructors/destructors, `new`/`delete`, `cout`/`cin` stream operators, namespaces, templates, try/catch, and `#include` headers.
- **Python Support:** Indentation-based block parsing, `def`/`class`/`lambda`, list comprehensions, decorators, `try`/`except`, `with` statements, f-strings.
- **Output:** Abstract Syntax Tree (AST) rendered as an interactive tree view.

### 3. Semantic Analysis (Scope-Stack Symbol Table)
- **Mechanism:** Stack-based scope management with nested symbol tables.
- **Checks:** Type compatibility, variable redeclaration warnings, undeclared variable detection, and scope-level access validation.
- **Output:** Flat symbol table with type, scope level, and memory address for each symbol, plus a detailed semantic log.

### 4. Intermediate Code Generation (Quadruples & TAC)
- **Format:** Three-Address Code (TAC) rendered alongside raw quadruples `(op, arg1, arg2, result)`.
- **Coverage:** Variable assignments, arithmetic/relational/logical expressions, function calls (`param`/`call`/`return`), control flow (`ifFalse`/`goto`/`label`), and I/O operations.

### 5. Code Optimization
- **Constant Folding:** Evaluates constant expressions at compile time.
- **Constant Propagation:** Substitutes known constant values throughout the code.
- **Dead Code Elimination:** Removes unused temporary assignments.
- **Output:** Side-by-side comparison of pre- and post-optimization TAC with a list of applied strategies.

### 6. Target Code Generation (Intel 8085 Assembly)
- **Target Architecture:** Intel 8085 Microprocessor.
- **Instructions:** `MVI`, `LDA`, `STA`, `MOV`, `ADD`, `SUB`, `ADI`, `SUI`, `CMP`, `CPI`, `JMP`, `JZ`, `JNZ`, `CALL`, `OUT`, `HLT`.
- **Register Allocation:** Maps variables to registers A, B, C, D, H, L.
- **Memory Mapping:** Sequential memory addresses starting from `0x2000`.
- **Output:** Formatted assembly table with address, instruction, operands, and inline comments.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **UI Framework** | React 19 (Hooks & Functional Components) |
| **Build Tool** | Vite 7 |
| **Styling** | CSS Modules (Custom Dark Theme) |
| **Diagrams** | Mermaid.js |
| **Desktop** | Electron 41 (optional) |
| **Linting** | ESLint 9 with React Hooks & React Refresh plugins |

---

## 📁 Project Architecture

```
CompileFlow-main/
├── index.html                  # Vite entry point
├── vite.config.js              # Vite + React plugin config
├── package.json                # Dependencies & scripts
├── main.js                     # Electron main process (optional)
│
├── src/
│   ├── main.jsx                # React mount point
│   ├── App.jsx                 # Root component — pipeline orchestrator
│   ├── App.module.css           # Layout styles (two-column grid)
│   ├── index.css               # Global design tokens & dark theme
│   │
│   ├── compiler/               # ★ Compiler Engine Core
│   │   ├── base.js             # CompilerError class, shared optimizer & 8085 ASM generator
│   │   ├── engine.js           # Central dispatcher — routes to language engine
│   │   ├── c_engine.js         # Full C compiler pipeline (~670 LOC)
│   │   ├── cpp_engine.js       # Full C++ compiler pipeline (~700 LOC)
│   │   ├── python_engine.js    # Full Python compiler pipeline (~700 LOC)
│   │   └── flow_engine.js      # Mini "Flow" DSL engine (educational)
│   │
│   └── components/             # ★ UI Components
│       ├── Header.jsx          # App header/branding bar
│       ├── SourcePanel.jsx     # Code editor, language selector, pipeline nav
│       ├── WelcomeScreen.jsx   # Landing/intro screen
│       ├── LexicalPhase.jsx    # Token table + DFA/NFA Mermaid diagrams
│       ├── SyntaxPhase.jsx     # Interactive AST tree viewer
│       ├── SemanticPhase.jsx   # Symbol table + semantic logs
│       ├── ICGPhase.jsx        # Quadruples table + TAC listing
│       ├── OptimizationPhase.jsx # Before/after TAC + strategies
│       ├── TargetPhase.jsx     # 8085 assembly table
│       ├── Mermaid.jsx         # Mermaid diagram renderer
│       └── *.module.css        # Component-scoped styles
│
├── *.md                        # Documentation (per-phase theory)
└── test_runner.mjs             # Automated test harness
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18.x or higher
- **npm** v9+ (or yarn / pnpm)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/CompileFlow.git
cd CompileFlow

# 2. Install dependencies
npm install

# 3. Launch the development server
npm run dev
```

Open **http://localhost:5173** in your browser.

### Desktop App (Electron)

```bash
# Run as a desktop application
npm run electron:dev
```

---

## 🖥️ Interface Guide

1. **Source Code Editor** — Write or paste code in the left panel. Choose between **C**, **C++**, or **Python** from the language dropdown.
2. **Compile & Analyze** — Click the compile button to trigger the full 6-stage pipeline. A progress animation walks through each phase.
3. **Pipeline Navigation** — Use the sidebar buttons to jump between any compilation stage and inspect its output:
   - **Lexical** → Token table + automaton diagrams
   - **Syntax** → Abstract Syntax Tree
   - **Semantic** → Symbol table & analysis logs
   - **ICG** → Quadruples & Three-Address Code
   - **Optimization** → Before/after comparison & strategies
   - **Target** → Intel 8085 assembly listing
4. **Error Reporting** — Compiler errors display inline with line/column information. The error-tolerant parser gracefully recovers when possible.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (hot reload) |
| `npm run build` | Production build to `/dist` |
| `npm run preview` | Preview production build locally |
| `npm run electron` | Launch Electron (production build) |
| `npm run electron:dev` | Launch Electron with Vite dev server |

---

## 📚 Documentation

Detailed theory documents are included for each compilation phase:

- [`lexical_analyzer.md`](./lexical_analyzer.md) — DFA/NFA theory & tokenization rules
- [`syntax_analyzer.md`](./syntax_analyzer.md) — Grammar rules & recursive descent parsing
- [`semantic_analyzer.md`](./semantic_analyzer.md) — Type checking & scope management
- [`intermediate_code_generation.md`](./intermediate_code_generation.md) — TAC & quadruple generation
- [`code_optimization.md`](./code_optimization.md) — Optimization strategies & passes
- [`symbol_table_manager.md`](./symbol_table_manager.md) — Symbol table architecture
- [`engine_code_explanation.md`](./engine_code_explanation.md) — Engine architecture deep-dive
- [`explanation_script.md`](./explanation_script.md) — Full project presentation script

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Built as a Full-Stack Computer Science Project — 6th Semester.*