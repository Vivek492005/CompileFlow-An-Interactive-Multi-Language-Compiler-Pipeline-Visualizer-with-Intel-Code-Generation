import { CompilerError, optimize, generateASM } from './base';

// --- 1. Lexical Analyzer ---
export function lexer(code) {
    const tokens = [];
    let i = 0, line = 1, col = 1;
    const keywords = [
        'def', 'class', 'if', 'elif', 'else', 'while', 'for', 'in', 'is', 'not',
        'and', 'or', 'try', 'except', 'finally', 'raise', 'import', 'from',
        'as', 'global', 'nonlocal', 'assert', 'pass', 'break', 'continue',
        'return', 'yield', 'del', 'with', 'lambda', 'async', 'await', 'None',
        'True', 'False', 'print', 'input'
    ];
    const multiCharOps = ['==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '//', '**', '->'];
    const singleCharOps = ['+', '-', '*', '/', '=', '<', '>', '!', '%', '&', '|', '^', '~', '@'];
    const punctuation = ['(', ')', '[', ']', '{', '}', ';', ',', '.', ':'];

    // Preprocessing indentations and comments
    let indentStack = [0];
    const lines = code.split('\n');
    let processedCode = '';
    let inMultilineStr = false;

    for (let lineText of lines) {
        if (!inMultilineStr && lineText.trim() === '') { processedCode += '\n'; continue; }
        
        let trimL = lineText.trim();
        if (!inMultilineStr && trimL.startsWith('"""') && trimL.endsWith('"""') && trimL.length > 3) { processedCode += '\n'; continue; }
        if (trimL.includes('"""')) inMultilineStr = !inMultilineStr;
        if (inMultilineStr) { processedCode += '\n'; continue; }
        if (trimL.startsWith('#')) { processedCode += '\n'; continue; }

        let currentIndent = lineText.match(/^\s*/)[0].length;
        if (currentIndent > indentStack[indentStack.length - 1]) {
            indentStack.push(currentIndent);
            processedCode += ' INDENT ' + trimL + '\n';
        } else if (currentIndent < indentStack[indentStack.length - 1]) {
            while (currentIndent < indentStack[indentStack.length - 1]) {
                indentStack.pop(); processedCode += ' DEDENT ';
            }
            processedCode += trimL + '\n';
        } else {
            processedCode += trimL + '\n';
        }
    }
    while (indentStack.length > 1) { indentStack.pop(); processedCode += ' DEDENT '; }
    code = processedCode + '\n';

    while (i < code.length) {
        let char = code[i];
        if (char === '\n') { line++; col = 1; i++; continue; }
        if (/\s/.test(char)) { col++; i++; continue; }
        
        if (char === '"' || char === "'") {
            let quote = char;
            let startCol = col; let str = quote; i++; col++;
            while (i < code.length && code[i] !== quote) { str += code[i]; if (code[i] === '\n') { line++; col = 1; } else { col++; } i++; }
            str += quote; i++; col++; tokens.push({ type: 'STRING', lexeme: str, line, col: startCol }); continue;
        }
        if (/\d/.test(char)) {
            let startCol = col; let num = ''; let hasDot = false;
            while (i < code.length && /[\d.]/.test(code[i])) { if (code[i] === '.') hasDot = true; num += code[i]; i++; col++; }
            tokens.push({ type: hasDot ? 'FLOAT_CONST' : 'INT_CONST', lexeme: num, line, col: startCol }); continue;
        }
        if (/[a-zA-Z_]/.test(char)) {
            let startCol = col; let word = '';
            while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) { word += code[i]; i++; col++; }
            tokens.push({ type: keywords.includes(word) ? 'KEYWORD' : 'IDENTIFIER', lexeme: word, line, col: startCol }); continue;
        }
        if (char === 'I' && code.substr(i, 6) === 'INDENT') {
            tokens.push({ type: 'INDENT', lexeme: 'INDENT', line, col }); i += 6; col += 6; continue;
        }
        if (char === 'D' && code.substr(i, 6) === 'DEDENT') {
            tokens.push({ type: 'DEDENT', lexeme: 'DEDENT', line, col }); i += 6; col += 6; continue;
        }

        let isOp = false;
        for (let op of multiCharOps) if (code.substr(i, op.length) === op) { tokens.push({ type: 'OPERATOR', lexeme: op, line, col }); i += op.length; col += op.length; isOp = true; break; }
        if (isOp) continue;
        
        if (singleCharOps.includes(char)) { tokens.push({ type: 'OPERATOR', lexeme: char, line, col }); i++; col++; continue; }
        if (punctuation.includes(char)) { tokens.push({ type: 'PUNCTUATION', lexeme: char, line, col }); i++; col++; continue; }
        i++;
    }
    return tokens;
}

// --- 2. Syntax Analyzer ---
class Parser {
    constructor(tokens) { this.tokens = tokens; this.pos = 0; }
    peek() { return this.tokens[this.pos] || null; }
    advance() { return this.tokens[this.pos++]; }
    matchLex(lex) { if (this.peek()?.lexeme === lex) return this.advance(); return null; }
    matchType(type) { if (this.peek()?.type === type) return this.advance(); return null; }
    expectLex(lex) { const t = this.matchLex(lex); if (!t) throw new CompilerError(`Expected '${lex}'`); return t; }
    expectType(type) { const t = this.matchType(type); if (!t) throw new CompilerError(`Expected ${type}`); return t; }

    parse() {
        let root = { name: 'Program', children: [] };
        while (this.pos < this.tokens.length) {
            root.children.push(this.parseTopLevel());
        }
        return root;
    }

    parseTopLevel() {
        try {
            let t = this.peek();
            if (t?.lexeme === 'def' || t?.lexeme === 'async') return this.parseDef();
            if (t?.lexeme === 'class') return this.parseClass();
            if (t?.lexeme === 'import' || t?.lexeme === 'from') return this.parseImport();
            return this.parseStatement();
        } catch(e) {
            this.sync(); return { name: `Unhandled Block`, isLeaf: true, isErrorNode: true };
        }
    }

    sync() {
        while (this.peek() && !['DEDENT', 'EOF'].includes(this.peek().type)) this.advance();
    }

    parseImport() {
        if (this.matchLex('import')) {
            let id = this.expectType('IDENTIFIER').lexeme;
            while(this.matchLex('.')) id += '.' + this.expectType('IDENTIFIER').lexeme;
            if (this.matchLex('as')) id += ' as ' + this.expectType('IDENTIFIER').lexeme;
            return { name: 'Import', module: id, children: [] };
        }
        if (this.matchLex('from')) {
            let mod = this.expectType('IDENTIFIER').lexeme;
            this.expectLex('import');
            let id = this.expectType('IDENTIFIER').lexeme;
            return { name: 'FromImport', module: mod, item: id, children: [] };
        }
    }

    parseClass() {
        this.expectLex('class');
        let id = this.expectType('IDENTIFIER').lexeme;
        let inherit = null;
        if (this.matchLex('(')) { inherit = this.expectType('IDENTIFIER').lexeme; this.expectLex(')'); }
        this.expectLex(':');
        let body = this.parsePythonBlock();
        return { name: 'Class', id, inherit, body, children: [body] };
    }

    parseDef() {
        if (this.matchLex('async')) {}
        this.expectLex('def'); 
        let id = this.expectType('IDENTIFIER').lexeme;
        this.expectLex('(');
        let params = [];
        if (this.peek() && this.peek().lexeme !== ')') {
            
            let pStr = this.expectType('IDENTIFIER').lexeme;
            if (this.matchLex(':')) { pStr += ':' + this.expectType('IDENTIFIER').lexeme; }
            params.push(pStr);

            while (this.matchLex(',')) {
                let p2Str = this.expectType('IDENTIFIER').lexeme;
                if (this.matchLex(':')) { p2Str += ':' + this.expectType('IDENTIFIER').lexeme; }
                params.push(p2Str);
            }
        }
        this.expectLex(')');
        let returnType = 'dynamic';
        if (this.matchLex('->')) {
            returnType = this.advance().lexeme;
        }
        this.expectLex(':');
        
        let body = this.parsePythonBlock();
        return { name: 'Function', id, params, returnType, body, children: [body] };
    }

    parsePythonBlock() {
        if (!this.matchType('INDENT')) {
            let stmt = this.parseStatement(); return { name: 'Block', children: [stmt] };
        }
        let node = { name: 'Block', children: [] };
        while (this.peek() && this.peek().type !== 'DEDENT') {
            node.children.push(this.parseStatement());
        }
        this.expectType('DEDENT');
        return node;
    }

    parseStatement() {
        try {
            let t = this.peek();
            if (!t) return { name: 'EOF', isLeaf: true };
            if (t.lexeme === 'if') return this.parseIf();
            if (t.lexeme === 'while') return this.parseWhile();
            if (t.lexeme === 'for') return this.parseFor();
            if (t.lexeme === 'return') return this.parseReturn();
            if (t.lexeme === 'print') return this.parsePrint();
            if (t.lexeme === 'break') { this.advance(); return { name: 'Break', isLeaf: true }; }
            if (t.lexeme === 'continue') { this.advance(); return { name: 'Continue', isLeaf: true }; }
            if (t.lexeme === 'pass') { this.advance(); return { name: 'Pass', isLeaf: true }; }
            if (t.lexeme === 'try') return this.parseTry();
            if (t.lexeme === 'raise') { this.advance(); let e = this.parseExpression(); return { name: 'Raise', expr: e, children: [e] }; }
            
            if (t.type === 'IDENTIFIER') {
                let start = this.pos;
                this.advance();
                if (this.matchLex(':')) { this.advance(); } // type hint parse discard on var decl x: int = 5
                
                while (this.matchLex('[')) { this.parseExpression(); this.expectLex(']'); }
                while (this.matchLex('.')) { this.advance(); }
                
                let isAssign = this.peek()?.lexeme === '=' || ['+=', '-=', '*=', '/='].includes(this.peek()?.lexeme);
                this.pos = start;
                if (isAssign) return this.parseAssignment();
                else return this.parseExpressionStmt();
            }

            this.advance(); return { name: 'Statement', children: [] };
        } catch (e) {
            let errToken = this.peek() || { lexeme: 'EOF' };
            while (this.peek() && this.peek().type !== 'INDENT' && this.peek().type !== 'DEDENT') this.advance();
            return { name: `Unhandled Sync: ${errToken.lexeme}`, isLeaf: true, isErrorNode: true };
        }
    }

    parseTry() {
        this.expectLex('try'); this.expectLex(':');
        let body = this.parsePythonBlock();
        let excepts = [];
        while (this.matchLex('except')) {
            let excType = null; let excId = null;
            if (this.peek() && this.peek().lexeme !== ':') {
                excType = this.advance().lexeme;
                if (this.matchLex('as')) excId = this.expectType('IDENTIFIER').lexeme;
            }
            this.expectLex(':');
            excepts.push({ type: excType, id: excId, body: this.parsePythonBlock() });
        }
        let finallyBlock = null;
        if (this.matchLex('finally')) {
            this.expectLex(':'); finallyBlock = this.parsePythonBlock();
        }
        return { name: 'TryExcept', body, excepts, finallyBlock, children: [body, ...excepts.map(e => e.body)].filter(Boolean) };
    }

    parseIf() {
        this.advance(); 
        let cond = this.parseExpression(); 
        
        // Track __name__ == "__main__"
        let isMain = false;
        if (cond.name === '==' && cond.left?.name === '__name__' && cond.right?.name === '"__main__"') isMain = true;

        this.expectLex(':');
        let body = this.parsePythonBlock();
        let node = { name: isMain ? 'EntryPoint' : 'If', cond, body, elses: [], children: [cond, body] };
        
        while (this.matchLex('elif')) {
            let elifCond = this.parseExpression(); this.expectLex(':');
            let elifBody = this.parsePythonBlock();
            node.elses.push({ type: 'elif', cond: elifCond, body: elifBody });
            node.children.push(elifCond, elifBody);
        }

        if (this.matchLex('else')) {
            this.expectLex(':');
            let elseBody = this.parsePythonBlock();
            node.elses.push({ type: 'else', body: elseBody });
            node.children.push(elseBody);
        }
        return node;
    }

    parseWhile() {
        this.advance(); let cond = this.parseExpression(); this.expectLex(':');
        let body = this.parsePythonBlock(); return { name: 'While', cond, body, children: [cond, body] };
    }

    parseFor() {
        this.advance();
        let iterator = this.expectType('IDENTIFIER').lexeme;
        this.expectLex('in');
        let iterable = this.parseExpression();
        this.expectLex(':');
        let body = this.parsePythonBlock();
        return { name: 'ForIn', iterator, iterable, body, children: [{name: iterator, isLeaf: true}, iterable, body] };
    }

    parseReturn() {
        this.expectLex('return');
        let expr = null;
        if (this.peek() && this.peek().type !== 'INDENT' && this.peek().type !== 'DEDENT' && this.peek().lexeme !== 'elif' && this.peek().lexeme !== 'else') {
            expr = this.parseExpression();
        }
        return { name: 'Return', expr, children: expr ? [expr] : [] };
    }

    parseAssignment() {
        let idNode = this.advance(); let id = idNode.lexeme;
        if (this.matchLex(':')) this.advance(); // type hint swallow
        while (this.matchLex('[')) { id += `[${this.parseExpression().name || 'idx'}]`; this.expectLex(']'); }
        while (this.matchLex('.')) { id += `.${this.expectType('IDENTIFIER').lexeme}`; }

        let op = this.advance().lexeme;
        let expr = this.parseExpression();
        return { name: 'Assign', id, op, expr, children: [{name: id, isLeaf: true}, expr] };
    }

    parsePrint() {
        this.advance(); this.expectLex('('); 
        let arg = this.parseExpression(); 
        this.expectLex(')'); return { name: 'Print', children: [arg] };
    }

    parseExpressionStmt() {
        let expr = this.parseExpression(); return { name: 'ExprStmt', expr, children: [expr] };
    }

    parseExpression() { return this.parseLogical(); }
    parseLogical() {
        let node = this.parseRelational();
        while (this.peek() && (this.peek().lexeme === 'and' || this.peek().lexeme === 'or')) {
            let op = this.advance().lexeme; let right = this.parseRelational();
            node = { name: op, op, left: node, right, children: [node, right] };
        }
        return node;
    }
    parseRelational() {
        let node = this.parseAdditive();
        const relOps = ['<', '>', '<=', '>=', '==', '!=', 'is', 'not'];
        while (this.peek() && relOps.includes(this.peek().lexeme)) {
            let op = this.advance().lexeme; let right = this.parseAdditive();
            node = { name: op, op, left: node, right, children: [node, right] };
        }
        return node;
    }
    parseAdditive() {
        let node = this.parseTerm();
        while (this.peek() && (this.peek().lexeme === '+' || this.peek().lexeme === '-')) {
            let op = this.advance().lexeme; let right = this.parseTerm();
            node = { name: op, op, left: node, right, children: [node, right] };
        }
        return node;
    }
    parseTerm() {
        let node = this.parseFactor();
        while (this.peek() && (this.peek().lexeme === '*' || this.peek().lexeme === '/' || this.peek().lexeme === '//' || this.peek().lexeme === '%')) {
            let op = this.advance().lexeme; let right = this.parseFactor();
            node = { name: op, op, left: node, right, children: [node, right] };
        }
        return node;
    }
    parseFactor() {
        if (this.matchLex('[')) {
            let elements = [];
            if (this.peek() && this.peek().lexeme !== ']') {
                elements.push(this.parseExpression());
                while (this.matchLex(',')) elements.push(this.parseExpression());
            }
            this.expectLex(']'); return { name: 'List', elements, isLeaf: false, children: elements };
        }
        if (this.matchLex('{')) {
            let pairs = [];
            if (this.peek() && this.peek().lexeme !== '}') {
                do {
                    let k = this.parseExpression(); this.expectLex(':'); let v = this.parseExpression();
                    pairs.push({k, v});
                } while (this.matchLex(','));
            }
            this.expectLex('}'); return { name: 'Dict', pairs, isLeaf: false, children: pairs.map(p => p.v) };
        }
        if (this.matchLex('(')) { let node = this.parseExpression(); this.expectLex(')'); return node; }

        let t = this.peek();
        if (!t) throw new CompilerError('Unexpected EOF in expression', 'EOF', 'EOF');
        
        if (['INT_CONST', 'FLOAT_CONST', 'STRING', 'IDENTIFIER', 'KEYWORD'].includes(t.type)) {
            let node = this.advance();
            
            // Input interceptor
            if (node.lexeme === 'input' && this.matchLex('(')) {
                let prmpt = null; if (this.peek()?.lexeme !== ')') prmpt = this.parseExpression();
                this.expectLex(')'); return { name: 'Input', prompt: prmpt, isLeaf: true };
            }

            if (node.type === 'IDENTIFIER' && this.matchLex('.')) {
                let subId = this.expectType('IDENTIFIER').lexeme;
                if (this.matchLex('(')) {
                    let args = [];
                    if (this.peek() && this.peek().lexeme !== ')') {
                        args.push(this.parseExpression()); while (this.matchLex(',')) args.push(this.parseExpression());
                    }
                    this.expectLex(')');
                    return { name: `${node.lexeme}.${subId}()`, args, children: args };
                }
            }
            if (node.type === 'IDENTIFIER' && this.matchLex('(')) {
                let args = [];
                if (this.peek() && this.peek().lexeme !== ')') {
                    args.push(this.parseExpression()); while (this.matchLex(',')) args.push(this.parseExpression());
                }
                this.expectLex(')'); return { name: `${node.lexeme}()`, id: node.lexeme, args, children: args };
            }
            if (node.type === 'IDENTIFIER' && this.matchLex('[')) {
                let idx = this.parseExpression(); this.expectLex(']');
                return { name: `AccessRef`, id: node.lexeme, isLeaf: true, children: [idx] };
            }

            return { name: node.lexeme, typeClass: node.type, isLeaf: true };
        }
        throw new CompilerError(`Invalid expression factor '${t.lexeme}'`);
    }
}

// --- 3. Semantic Analyzer ---
export function analyzeSemantics(ast) {
    let symbolMapStack = [new Map()];
    let flatSymbolTable = [];
    let logs = [];
    let currentScopeLevel = 0;

    function enterScope() { currentScopeLevel++; symbolMapStack.push(new Map()); }
    function exitScope() { symbolMapStack.pop(); currentScopeLevel--; }
    function lookup(name) { for (let i = symbolMapStack.length - 1; i >= 0; i--) if (symbolMapStack[i].has(name)) return symbolMapStack[i].get(name); return null; }

    function traverse(node) {
        if (!node) return;
        if (node.name === 'Program' || node.name === 'Block') {
            enterScope(); if (node.children) node.children.forEach(traverse); exitScope();
        } else if (node.name === 'Import' || node.name === 'FromImport') {
            logs.push(`Import Mapped dynamically: [${node.module}]`);
        } else if (node.name === 'Class') {
            let cSym = { name: node.id, type: 'class', scopeLevel: currentScopeLevel, mem: 'global' };
            symbolMapStack[symbolMapStack.length - 1].set(node.id, cSym);
            flatSymbolTable.push(cSym);
            logs.push(`Python Class [${node.id}] context established`);
            enterScope(); traverse(node.body); exitScope();
        } else if (node.name === 'Function') {
            let fSym = { name: node.id, type: 'def -> function', scopeLevel: currentScopeLevel, mem: 'code' };
            symbolMapStack[symbolMapStack.length - 1].set(node.id, fSym);
            flatSymbolTable.push(fSym);
            logs.push(`Python Function [${node.id}] context established`);
            enterScope();
            if (node.params) node.params.forEach(p => {
                let pureId = p.split(':')[0]; // strip type hint
                let pSym = { name: pureId, type: 'dynamic (param)', scopeLevel: currentScopeLevel, mem: 'stack' };
                symbolMapStack[symbolMapStack.length - 1].set(pureId, pSym);
                flatSymbolTable.push(pSym);
            });
            traverse(node.body);
            exitScope();
        } else if (node.name === 'EntryPoint') {
            logs.push(`Python Executable Main Entry Point Verified (__main__)`);
            enterScope(); traverse(node.body); exitScope();
        } else if (node.name === 'TryExcept') {
            enterScope(); logs.push("Exception Handler Block Stacked");
            traverse(node.body); exitScope();
            node.excepts.forEach(e => { enterScope(); traverse(e.body); exitScope(); });
            if (node.finallyBlock) { enterScope(); traverse(node.finallyBlock); exitScope(); }
        } else if (node.name === 'Assign') {
            let sym = { name: node.id, type: 'dynamic', scopeLevel: currentScopeLevel, mem: 'stack' };
            if (node.expr && (node.expr.name === 'List' || node.expr.name === 'Dict')) sym.type = node.expr.name.toLowerCase();
            if (!lookup(node.id) && !node.id.includes('[')) {
                symbolMapStack[symbolMapStack.length - 1].set(node.id, sym);
                flatSymbolTable.push(sym);
                logs.push(`Variable [${node.id}] dynamically bound (${sym.type})`);
            }
            traverse(node.expr);
        } else if (node.name === 'ForIn') {
            let sym = { name: node.iterator, type: 'iterator', scopeLevel: currentScopeLevel + 1, mem: 'stack' };
            flatSymbolTable.push(sym);
            enterScope(); symbolMapStack[symbolMapStack.length - 1].set(node.iterator, sym);
            traverse(node.iterable); traverse(node.body); exitScope();
        } else if (node.name.endsWith('()') && node.id) {
            logs.push(`Dynamic dispatched function call: ${node.id}`);
            if (node.args) node.args.forEach(traverse);
        } else {
            if (node.children) node.children.forEach(traverse);
            if (node.cond) traverse(node.cond);
            if (node.body) traverse(node.body);
            if (node.elses) node.elses.forEach(e => { if (e.cond) traverse(e.cond); if (e.body) traverse(e.body); });
            if (node.expr) traverse(node.expr);
        }
    }
    traverse(ast);
    return { flatSymbolTable, logs };
}

// --- 4. Intermediate Code Generator ---
export function generateICG(ast) {
    let quads = [], tac = [], tempCount = 1, labelCount = 1;
    function newTemp() { return `t${tempCount++}`; }
    function newLabel() { return `L${labelCount++}`; }
    function emit(op, arg1, arg2, res) {
        quads.push({ op, arg1, arg2, res });
        if (op === '=') tac.push(`${res} = ${arg1}`);
        else if (['+', '-', '*', '/', '//', '%', '<', '>', '<=', '>=', '==', '!=', 'and', 'or', 'is', 'not'].includes(op)) tac.push(`${res} = ${arg1} ${op} ${arg2}`);
        else if (op === 'ifFalse') tac.push(`ifFalse ${arg1} goto ${res}`);
        else if (op === 'goto') tac.push(`goto ${res}`);
        else if (op === 'label') tac.push(`${res}:`);
        else if (op === 'print') tac.push(`print ${arg1}`);
        else if (op === 'input') tac.push(`input into ${res}`);
        else if (op === 'raise') tac.push(`raise ${arg1}`);
        else if (op === 'param') tac.push(`param ${arg1}`);
        else if (op === 'call') tac.push(`${res} = call ${arg1}, ${arg2}`);
        else if (op === 'return') tac.push(`return ${arg1}`);
    }

    let loops = [];

    function genExpr(node) {
        if (!node) return '';
        if (node.isLeaf && node.name !== 'Input') return node.name;
        
        if (node.name === 'Input') {
            let t = newTemp(); emit('input', node.prompt ? genExpr(node.prompt) : '', '', t); return t;
        }

        if (node.id && node.name.endsWith('()')) {
            if (node.args) node.args.forEach(arg => emit('param', genExpr(arg), '', ''));
            let t = newTemp(); emit('call', node.id, node.args ? node.args.length : 0, t); return t;
        }

        if (node.name === 'List' || node.name === 'Dict') return `alloc_${node.name.toLowerCase()}`;

        let left = genExpr(node.left); let right = genExpr(node.right);
        let t = newTemp(); emit(node.op, left, right, t); return t;
    }

    function genStmt(node) {
        if (!node) return;
        if (node.name === 'Program' || node.name === 'Block' || node.name === 'EntryPoint') {
            if (node.children) node.children.forEach(genStmt);
        } else if (node.name === 'Function') {
            emit('label', '', '', node.id); genStmt(node.body);
        } else if (node.name === 'Class') {
            emit('label', '', '', 'class_' + node.id); genStmt(node.body);
        } else if (node.name === 'Assign') {
            let pureOp = node.op.replace('=', '');
            if (pureOp) { let t = newTemp(); emit(pureOp, node.id, genExpr(node.expr), t); emit('=', t, '', node.id); }
            else { emit('=', genExpr(node.expr), '', node.id); }
        } else if (node.name === 'Print') {
            node.children.forEach(child => emit('print', genExpr(child), '', ''));
        } else if (node.name === 'If') {
            let lEnd = newLabel(), condVar = genExpr(node.cond), lNext = newLabel();
            emit('ifFalse', condVar, '', lNext); genStmt(node.body); emit('goto', '', '', lEnd); emit('label', '', '', lNext);
            if (node.elses) {
                node.elses.forEach(el => {
                    if (el.type === 'elif') {
                        let eCondVar = genExpr(el.cond), eNext = newLabel();
                        emit('ifFalse', eCondVar, '', eNext); genStmt(el.body); emit('goto', '', '', lEnd); emit('label', '', '', eNext);
                    } else if (el.type === 'else') { genStmt(el.body); }
                });
            }
            emit('label', '', '', lEnd);
        } else if (node.name === 'While') {
            let lStart = newLabel(), lEnd = newLabel(); loops.push({start: lStart, end: lEnd});
            emit('label', '', '', lStart);
            let condVar = genExpr(node.cond);
            emit('ifFalse', condVar, '', lEnd); genStmt(node.body); emit('goto', '', '', lStart);
            emit('label', '', '', lEnd); loops.pop();
        } else if (node.name === 'ForIn') {
            let lStart = newLabel(), lEnd = newLabel(); loops.push({start: lStart, end: lEnd});
            emit('=', genExpr(node.iterable) + '.iter()', '', 'it');
            emit('label', '', '', lStart);
            let tCond = newTemp(); emit('call', 'it.hasNext', 0, tCond); emit('ifFalse', tCond, '', lEnd);
            let tNext = newTemp(); emit('call', 'it.next', 0, tNext); emit('=', tNext, '', node.iterator);
            genStmt(node.body); emit('goto', '', '', lStart); emit('label', '', '', lEnd); loops.pop();
        } else if (node.name === 'TryExcept') {
            let tryLbl = newLabel(), catchLbl = newLabel(), endLbl = newLabel();
            emit('label', '', '', tryLbl); genStmt(node.body); emit('goto', '', '', endLbl);
            emit('label', '', '', catchLbl); node.excepts.forEach(e => genStmt(e.body));
            emit('label', '', '', endLbl);
            if (node.finallyBlock) genStmt(node.finallyBlock);
        } else if (node.name === 'Break') {
            if (loops.length > 0) emit('goto', '', '', loops[loops.length - 1].end);
        } else if (node.name === 'Continue') {
            if (loops.length > 0) emit('goto', '', '', loops[loops.length - 1].start);
        } else if (node.name === 'Raise') {
            emit('raise', genExpr(node.expr), '', '');
        } else if (node.name === 'Return') {
            emit('return', node.expr ? genExpr(node.expr) : 'None', '', '');
        } else if (node.name === 'ExprStmt') {
            genExpr(node.expr);
        } else if (node.name === 'Pass') {}
    }
    genStmt(ast);
    return { quads, tac };
}

// --- Diagram Generation ---
export function getPythonDiagrams() {
    return {
        dfa: `stateDiagram-v2\n[*] --> S0\nS0 --> IndentCheck : newline\nIndentCheck --> INDENT : More Spaces\nIndentCheck --> DEDENT : Fewer Spaces\nS0 --> S1 : [a-zA-Z_]\nS1 --> S1 : [a-zA-Z0-9_]\nS1 --> [*] : Keyword`,
        nfa: `graph LR\nS((Start)) -->|def| F(Def)\nS -->|indent| IND(Indent)\nF --> End\nIND --> End`
    };
}

export function compilePython(code) {
    const tokens = lexer(code);
    const ast = new Parser(tokens).parse();
    const semantics = analyzeSemantics(ast);
    const icg = generateICG(ast);
    const opt = optimize(icg.quads);
    const asm = generateASM(opt.quads);
    const diagrams = getPythonDiagrams();
    return { tokens, ast, semantics, icg, opt, asm, diagrams };
}
