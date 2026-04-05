# Phase 3: Intermediate Code Generation (ICG)

## 1. Definition & Theory
**Intermediate Code Generation** is the phase where the compiler converts the high-level AST into a machine-neutral representation. This representation is easier to optimize and simpler to translate into the final machine assembly.

The most common form of intermediate code is **Three-Address Code (TAC)**, which represents every complex operation as a series of simple steps with at most three addresses (two operands and one result).

---

## 2. Quadruples Format
In this project, TAC is stored internally as **Quadruples**. A quadruple is a tuple of four elements:
1. **Operator**: The action to perform (`+`, `-`, `goto`, `ifFalse`).
2. **Argument 1**: The first operand.
3. **Argument 2**: The second operand (if any).
4. **Result**: Where the result is stored or the label to jump to.

**Example**: `x = a + b * c`
**Quadruples**:
1. `(*, b, c, t1)` -> *Temporary t1 = b * c*
2. `(+, a, t1, t2)` -> *Temporary t2 = a + t1*
3. `(=, t2, "", x)` -> *x = t2*

---

## 3. Implementation in `engine.js`
The `generateICG(ast)` function traverses the AST and "emits" quadruples.

### **A. Temporary Variable Generation**
Since hardware registers are limited, the ICG uses infinite "virtual" registers called Temporaries:
```javascript
let tempCount = 1;
function newTemp() { return `t${tempCount++}`; }
```

### **B. Control Flow (Labels & Jumps)**
For loops and if-statements, ICG uses **Labels** to manage jumping:
```javascript
if (node.name === 'While') {
    let lStart = newLabel(), lEnd = newLabel();
    emit('label', '', '', lStart);
    let condVar = genExpr(node.cond); // Evaluate condition
    emit('ifFalse', condVar, '', lEnd); // Jump to end if false
    genStmt(node.body);                 // Process loop body
    emit('goto', '', '', lStart);       // Jump back to start
    emit('label', '', '', lEnd);        // Define end label
}
```

---

## 4. Why use ICG?
1. **Portability**: You can write one "Frontend" (Lexer/Parser) and multiple "Backends" (Target Code Generators) for different CPUs (8085, x86, ARM) using the same ICG.
2. **Optimization**: Most compiler optimizations (like Constant Folding) are performed on the ICG rather than the complex AST or final Assembly.
