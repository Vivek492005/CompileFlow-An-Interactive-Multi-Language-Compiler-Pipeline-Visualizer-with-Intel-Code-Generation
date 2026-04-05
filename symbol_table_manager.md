# Phase 6: Symbol Table Manager

## 1. Definition & Theory
The **Symbol Table** is the central repository of information for every identifier (variables, functions, arrays) used in the source code. It is a critical data structure that persists throughout the semantic, ICG, and code generation phases.

The manager is responsible for **inserting** new symbols as they are declared and **looking up** existing symbols when they are used in expressions.

---

## 2. Structure: The Scope Stack
Because modern languages allow "Shadowing" (declaring a variable with the same name in a nested block), the Symbol Table is implemented as a **Stack of Hash Maps**.

*   **Global Map**: Stores variables visible to the entire program.
*   **Local Map(s)**: Stores variables defined inside `{ ... }` blocks or function parameters.

---

## 3. Attributes Stored
For every entry in the Symbol Table, the manager tracks several key attributes:

| Attribute | Description |
| :--- | :--- |
| **Name** | The literal string name (e.g., `totalSum`). |
| **Type** | Data type (`int`, `float`, `double`, `char`). |
| **Scope Level** | The nesting depth (0 for Global, 1+ for Local). |
| **Memory Address** | The virtual offset where the variable will be stored in hardware. |

---

## 4. Memory Mapping Logic
The Symbol Table Manager also acts as a "Memory Planner". It calculates how many bytes each variable requires and assigns it a unique hexadecimal address starting from `0x2000`.

```javascript
let memSize = 4; // Default
if (node.typeInfo.includes('double')) memSize = 8;
else if (node.typeInfo.includes('char')) memSize = 1;

let sym = {
    name: node.id,
    type: node.typeInfo,
    scopeLevel: currentScopeLevel,
    mem: `0x${memOffset.toString(16).padStart(4, '0')}` // e.g. 0x2004
};
memOffset += memSize; 
```

---

## 5. Role in Code Generation
Without the Symbol Table, the final **Target Code Generation** stage would fail. When generated Intel 8085 Assembly needs to load a variable:
1. It asks the Symbol Table: *"Where is variable 'a'?"*
2. The Symbol Table replies: *"It's at memory address 0x2000."*
3. The generator then emits: `LDA 2000H`.

This makes the Symbol Table the bridge between the high-level logic and the physical hardware memory.
