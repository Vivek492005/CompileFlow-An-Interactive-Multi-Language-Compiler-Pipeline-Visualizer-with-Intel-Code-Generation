# Phase 4: Code Optimization

## 1. Definition & Theory
**Code Optimization** is the process of transforming the intermediate code (TAC) so that the final executable becomes faster, smaller, or consumes less power. 

A key requirement of optimization is that it **must not change the meaning** of the program. It only changes how the computation is structured.

---

## 2. Optimization Strategies in CompileFlow
The `optimize(quads)` function in our engine implements several industry-standard techniques:

### **A. Constant Folding**
This involves evaluating expressions with constant values during compilation instead of at runtime.
*   **Example**: `x = 10 + 20`
*   **Optimized**: `x = 30`
*   **Code Implementation**:
    ```javascript
    if (['+', '-', '*', '/'].includes(op) && !isNaN(arg1) && !isNaN(arg2)) {
        let resultVal = eval(`${arg1} ${op} ${arg2}`);
        // Replace current quad with simple assignment
    }
    ```

### **B. Constant Propagation**
If a variable is assigned a constant value, that value is "propagated" to every subsequent use of that variable.
*   **Before**: `x = 10; y = x + 5;`
*   **After**: `x = 10; y = 10 + 5;` (Which will then be folded to `y = 15`).

### **C. Dead Code Elimination (DCE)**
This removes instructions that compute values that are never used later in the program. This happens often after Constant Propagation makes certain temporary variables redundant.
*   **Implementation**:
    1. Scan all quadruples to find which variables are "used" (input to a print, condition, or other expression).
    2. Any temporary variable (`t1`, `t2`) that is NOT in the used set is deleted.
    ```javascript
    if (q.res.startsWith('t') && !used.has(q.res)) {
        // Skip this instruction (It's dead code!)
    }
    ```

---

## 3. The Multi-Pass Advantage
Optimization is often performed in multiple "passes". 
1. **Pass 1**: Constant Folding calculates values.
2. **Pass 2**: Constant Propagation spreads those values.
3. **Pass 3**: Dead Code Elimination cleans up the mess.

This ensures that the final assembly generated for the Intel 8085 is as lean as possible, reducing the instruction count significantly for complex mathematical code.

---

## 4. Optimization Logs
The engine also returns a list of `strategies` used, which are displayed in the UI to help the user understand how their code was simplified:
- `Constant Folding: 10 + 20 -> 30`
- `Dead Code Elimination: Removed unused assignment to t5`
