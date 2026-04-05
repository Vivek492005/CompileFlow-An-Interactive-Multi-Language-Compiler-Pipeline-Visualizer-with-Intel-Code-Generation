# Phase 5: Semantic Analyzer

## 1. Definition & Theory
The **Semantic Analyzer** is the "logic checker" of the compiler. While the Syntax Analyzer ensures the code has the right *shape*, the Semantic Analyzer ensures it has the right *meaning*. 

Even if a sentence is grammatically correct (e.g., "The color green sleeps furiously"), it may not make sense. Similarly, `int x = "hello";` is syntactically perfect but semantically wrong because you cannot assign a string to an integer.

---

## 2. Implementation: Recursive AST Traversal
The `analyzeSemantics(ast)` function performs a depth-first traversal of the AST. As it visits each node, it performs specific logical checks.

### **Key Semantic Checks**
1.  **Declaration Check**: Every variable must be declared before it is used.
2.  **Duplicate Check**: A variable cannot be declared twice in the same scope.
3.  **Type Validation**: (Partial support in this project) Ensures that the memory assigned to a variable matches its declared type.
4.  **Scope Validation**: Ensures that local variables are not accessed outside their block.

---

## 3. Scope Management
The Semantic Analyzer manages **Scopes** using a stack-based approach. A "Scope" is a region of the program (like a function or a `{ ... }` block) where a variable is valid.

```javascript
let currentScopeLevel = 0;
let symbolMapStack = [new Map()]; // Global scope starts at index 0

function enterScope() {
    currentScopeLevel++;
    symbolMapStack.push(new Map());
}

function exitScope() {
    symbolMapStack.pop();
    currentScopeLevel--;
}
```

### **Variable Lookup Strategy**
When a variable is used, the engine searches the scopes from **innermost to outermost**:
1. Check the current block's Map.
2. If not found, check the parent block.
3. Finally, check the global Map.
4. If still not found, throw an "Undeclared variable" error.

---

## 4. Semantic Logs
In the CompileFlow UI, the Semantic stage provides a "Action Log" that shows exactly what the analyzer did:
- `Entered new scope level 1`
- `Declared variable [counter] of type int (4 bytes)`
- `Assignment to [counter] validated`
- `Exited scope level 1`

This transparency helps the user understand how the compiler tracks the "lifetime" of their variables.
