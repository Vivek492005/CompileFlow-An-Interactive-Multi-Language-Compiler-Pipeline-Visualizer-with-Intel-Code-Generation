import { CompilerError, optimize, generateASM } from './base';

// --- 1. Lexical Analyzer ---
export function lexer(code) {
    const tokens = [];
    let i = 0, line = 1, col = 1;
    const keywords = ['flow', 'end', 'set', 'show', 'if', 'else', 'while', 'function'];
    const multiCharOps = ['==', '!=', '<=', '>='];
    const singleCharOps = ['+', '-', '*', '/', '=', '<', '>', '!'];
    const punctuation = ['(', ')', ',', ':'];

    while (i < code.length) {
        let char = code[i];
        if (char === '\n') { line++; col = 1; i++; continue; }
        if (/\s/.test(char)) { col++; i++; continue; }
        
        if (/\d/.test(char)) {
            let startCol = col; let num = '';
            while (i < code.length && /\d/.test(code[i])) { num += code[i]; i++; col++; }
            tokens.push({ type: 'INT_CONST', lexeme: num, line, col: startCol }); continue;
        }
        if (/[a-zA-Z_]/.test(char)) {
            let startCol = col; let word = '';
            while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) { word += code[i]; i++; col++; }
            tokens.push({ type: keywords.includes(word) ? 'KEYWORD' : 'IDENTIFIER', lexeme: word, line, col: startCol }); continue;
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
    expectLex(lex) { const t = this.matchLex(lex); if (!t) throw new CompilerError(`Expected '${lex}'`, this.peek()?.line, this.peek()?.col); return t; }
    expectType(type) { const t = this.matchType(type); if (!t) throw new CompilerError(`Expected ${type}`, this.peek()?.line, this.peek()?.col); return t; }

    parse() {
        let root = { name: 'Program', children: [] };
        while (this.pos < this.tokens.length) root.children.push(this.parseTopLevel());
        return root;
    }

    parseTopLevel() {
        if (this.matchLex('flow')) {
            let id = this.expectType('IDENTIFIER').lexeme;
            let body = { name: 'Block', children: [] };
            while (this.peek() && this.peek().lexeme !== 'end') body.children.push(this.parseStatement());
            this.expectLex('end');
            return { name: 'FlowContainer', id, body, children: [body] };
        }
        return this.parseStatement();
    }

    parseStatement() {
        let t = this.peek();
        if (!t) return { name: 'EOF', isLeaf: true };
        if (t.lexeme === 'set') return this.parseSet();
        if (t.lexeme === 'show') return this.parseShow();
        if (t.lexeme === 'if') return this.parseIf();
        if (t.lexeme === 'while') return this.parseWhile();
        this.advance(); return { name: 'Misc', children: [] };
    }

    parseSet() {
        this.advance(); let id = this.expectType('IDENTIFIER').lexeme;
        this.expectLex('='); let expr = this.parseExpression();
        return { name: 'Assign', id, expr, children: [expr] };
    }

    parseShow() {
        this.advance(); let expr = this.parseExpression();
        return { name: 'Print', children: [expr] };
    }

    parseIf() {
        this.advance(); let cond = this.parseExpression();
        let body = { name: 'Block', children: [] };
        while (this.peek() && this.peek().lexeme !== 'end' && this.peek().lexeme !== 'else') body.children.push(this.parseStatement());
        let elseBody = null;
        if (this.matchLex('else')) {
            elseBody = { name: 'Block', children: [] };
            while (this.peek() && this.peek().lexeme !== 'end') elseBody.children.push(this.parseStatement());
        }
        this.expectLex('end');
        return { name: 'If', cond, body, elseBody, children: [cond, body, elseBody].filter(Boolean) };
    }

    parseWhile() {
        this.advance(); let cond = this.parseExpression();
        let body = { name: 'Block', children: [] };
        while (this.peek() && this.peek().lexeme !== 'end') body.children.push(this.parseStatement());
        this.expectLex('end');
        return { name: 'While', cond, body, children: [cond, body] };
    }

    parseExpression() {
        let t = this.peek();
        if (['INT_CONST', 'IDENTIFIER'].includes(t?.type)) return { name: this.advance().lexeme, isLeaf: true, typeClass: t.type };
        return { name: '0', isLeaf: true };
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
        if (node.name === 'Program' || node.name === 'Block' || node.name === 'FlowContainer') {
            enterScope(); if (node.children) node.children.forEach(traverse); exitScope();
        } else if (node.name === 'Assign') {
            let sym = { name: node.id, type: 'flow_val', scopeLevel: currentScopeLevel, mem: 'stack' };
            if (!lookup(node.id)) {
                symbolMapStack[symbolMapStack.length - 1].set(node.id, sym);
                flatSymbolTable.push(sym);
                logs.push(`Flow Variable [${node.id}] initialized`);
            }
            traverse(node.expr);
        } else if (node.isLeaf && node.typeClass === 'IDENTIFIER') {
            if (!lookup(node.name)) throw new CompilerError(`Variable [${node.name}] not found in Flow context`, 'Semantics');
        } else {
            if (node.children) node.children.forEach(traverse);
        }
    }
    traverse(ast);
    return { flatSymbolTable, logs };
}

// --- 4. Intermediate Code Generator ---
export function generateICG(ast) {
    let quads = [], tac = [], tempCount = 1;
    function newTemp() { return `t${tempCount++}`; }
    function emit(op, arg1, arg2, res) {
        quads.push({ op, arg1, arg2, res });
        if (op === '=') tac.push(`${res} = ${arg1}`);
    }
    function genStmt(node) {
        if (!node) return;
        if (node.name === 'Program' || node.name === 'Block' || node.name === 'FlowContainer') {
            if (node.children) node.children.forEach(genStmt);
        } else if (node.name === 'Assign') {
            emit('=', node.expr.name, '', node.id);
        }
    }
    genStmt(ast);
    return { quads, tac };
}

// --- Diagram Generation ---
export function getFlowDiagrams() {
    return {
        dfa: `stateDiagram-v2\n[*] --> S0\nS0 --> S_FLOW : 'flow'\nS_FLOW --> S_ID : space + [a-zA-Z]\nS_ID --> S_BODY : newline\nS_BODY --> S_END : 'end'\nS_END --> [*]`,
        nfa: `graph LR\nS((Start)) -->|flow| F(Prog)\nF -->|set| A(Assign)\nA -->|show| P(Print)\nP -->|end| E(Finish)\nE --> End`
    };
}

export function compileFlow(code) {
    const tokens = lexer(code);
    const ast = new Parser(tokens).parse();
    const semantics = analyzeSemantics(ast);
    const icg = generateICG(ast);
    const opt = optimize(icg.quads);
    const asm = generateASM(opt.quads);
    const diagrams = getFlowDiagrams();
    return { tokens, ast, semantics, icg, opt, asm, diagrams };
}
