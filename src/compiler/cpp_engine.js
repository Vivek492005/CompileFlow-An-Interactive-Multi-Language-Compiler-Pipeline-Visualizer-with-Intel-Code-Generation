import { CompilerError, optimize, generateASM } from './base';

// --- 1. Lexical Analyzer ---
export function lexer(code) {
    const tokens = [];
    let i = 0, line = 1, col = 1;

    const keywords = [
        'int', 'float', 'double', 'char', 'string', 'bool', 'long', 'short', 'const', 'void', 
        'if', 'else', 'while', 'for', 'do', 'return', 'break', 'continue', 
        'class', 'public', 'private', 'protected', 'namespace', 'using', 'new', 'delete', 
        'cout', 'cin', 'endl', 'try', 'catch', 'throw', 'template', 'typename'
    ];
    const multiCharOps = ['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '->', '::', '<<', '>>'];
    const singleCharOps = ['+', '-', '*', '/', '=', '<', '>', '!', '%', '&', '|', '^', '~', '?', ':'];
    const punctuation = ['(', ')', '{', '}', '[', ']', ';', ',', '.', '#'];

    while (i < code.length) {
        let char = code[i];

        if (char === '\n') { line++; col = 1; i++; continue; }
        if (/\s/.test(char)) { col++; i++; continue; }

        if (char === '/' && code[i + 1] === '/') {
            while (i < code.length && code[i] !== '\n') { i++; col++; }
            continue;
        }

        if (char === '/' && code[i + 1] === '*') {
            i += 2; col += 2;
            while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
                if (code[i] === '\n') { line++; col = 1; } else { col++; }
                i++;
            }
            i += 2; col += 2;
            continue;
        }

        if (char === '#') {
            let startCol = col; let directive = '#'; i++; col++;
            while (i < code.length && code[i] !== '\n') { directive += code[i]; i++; col++; }
            tokens.push({ type: 'PREPROCESSOR', lexeme: directive.trim(), line, col: startCol });
            continue;
        }

        if (char === '"') {
            let startCol = col; let str = '"'; i++; col++;
            while (i < code.length && code[i] !== '"') {
                if (code[i] === '\\') { str += code[i] + code[i+1]; i+=2; col+=2; continue; }
                str += code[i]; if (code[i] === '\n') { line++; col = 1; } else { col++; } i++;
            }
            str += '"'; i++; col++; tokens.push({ type: 'STRING', lexeme: str, line, col: startCol }); continue;
        }

        if (char === "'") {
            let startCol = col; let charLit = "'"; i++; col++;
            if (code[i] === '\\') { charLit += code[i] + code[i + 1]; i += 2; col += 2; }
            else { charLit += code[i]; i++; col++; }
            if (code[i] === "'") { charLit += "'"; i++; col++; tokens.push({ type: 'CHAR_LITERAL', lexeme: charLit, line, col: startCol }); continue; }
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

        let isOp = false;
        for (let op of multiCharOps) {
            if (code.substr(i, op.length) === op) {
                tokens.push({ type: 'OPERATOR', lexeme: op, line, col });
                i += op.length; col += op.length; isOp = true; break;
            }
        }
        if (isOp) continue;

        if (singleCharOps.includes(char)) { tokens.push({ type: 'OPERATOR', lexeme: char, line, col }); i++; col++; continue; }
        if (punctuation.includes(char)) { tokens.push({ type: 'PUNCTUATION', lexeme: char, line, col }); i++; col++; continue; }
        throw new CompilerError(`Unrecognized character: ${char}`, line, col);
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
            let t = this.peek();
            if (t.type === 'PREPROCESSOR') {
                root.children.push({ name: 'Header', id: this.advance().lexeme, isLeaf: true });
            } else if (t.lexeme === 'using') {
                root.children.push(this.parseUsing());
            } else if (t.lexeme === 'class') {
                root.children.push(this.parseClass());
            } else if (t.lexeme === 'template') {
                root.children.push(this.parseTemplate());
            } else {
                root.children.push(this.parseTopLevelFuncOrVar());
            }
        }
        return root;
    }

    parseUsing() {
        this.expectLex('using');
        let ns = this.advance().lexeme;
        let id = this.expectType('IDENTIFIER').lexeme;
        this.expectLex(';');
        return { name: `Using Namespace`, id, children: [{ name: id, isLeaf: true }] };
    }

    parseTemplate() {
        try {
            this.expectLex('template');
            this.expectLex('<');
            let templateTypes = [];
            while (this.peek() && this.peek().lexeme !== '>') {
                templateTypes.push(this.advance().lexeme);
            }
            this.expectLex('>');
            let inner = this.parseTopLevelFuncOrVar(); 
            return { name: 'TemplateWrapper', templateTypes, inner, children: [inner] };
        } catch(e) {
            this.sync(); return { name: 'Template Error', isLeaf: true, isErrorNode: true };
        }
    }

    parseClass() {
        try {
            this.expectLex('class');
            let id = this.expectType('IDENTIFIER').lexeme;
            this.expectLex('{');
            let body = { name: 'ClassBody', children: [] };
            while (this.peek() && this.peek().lexeme !== '}') {
                if (['public', 'private', 'protected'].includes(this.peek().lexeme)) {
                    let visibility = this.advance().lexeme;
                    this.expectLex(':');
                    body.children.push({ name: 'AccessSpecifier', id: visibility, isLeaf: true });
                    continue;
                }
                body.children.push(this.parseTopLevelFuncOrVar());
            }
            this.expectLex('}'); this.matchLex(';');
            return { name: 'Class', id, body, children: [body] };
        } catch(e) {
            this.sync(); return { name: 'Unhandled Class', isLeaf: true, isErrorNode: true };
        }
    }

    parseTopLevelFuncOrVar() {
        try {
            let startPos = this.pos;
            let isFunc = false;
            
            while (this.peek() && ![';','{','}','('].includes(this.peek().lexeme)) this.advance();
            if (this.matchLex('(')) isFunc = true;
            this.pos = startPos;

            if (isFunc) return this.parseFunctionDecl();
            return this.parseVarDecl();
        } catch (e) {
            this.sync(); return { name: 'Unhandled Declaration', isLeaf: true, isErrorNode: true };
        }
    }

    parseFunctionDecl() {
        let typeParts = [];
        while (this.peek() && !this.peek().lexeme.includes('(') && this.peek().type !== 'IDENTIFIER') {
            typeParts.push(this.advance().lexeme);
        }
        let returnType = typeParts.join(' ');
        let id = this.expectType('IDENTIFIER').lexeme;
        
        while (this.matchLex('::')) id += '::' + this.expectType('IDENTIFIER').lexeme;

        this.expectLex('(');
        let params = [];
        if (this.peek() && this.peek().lexeme !== ')') {
            params.push(this.parseParam());
            while (this.matchLex(',')) params.push(this.parseParam());
        }
        this.expectLex(')');
        let body = null;
        if (this.matchLex(';')) { body = { name: 'Prototype', isLeaf: true }; }
        else { body = this.parseBlock(); }

        return { name: id === 'main' ? 'MainFunction' : 'Function', returnType, id, params, body, children: [{ name: `${returnType} ${id}()`, isLeaf: true }, body] };
    }

    parseParam() {
        let typeParts = [];
        while (this.peek() && !this.peek().lexeme.includes(',') && !this.peek().lexeme.includes(')') && this.peek().type !== 'IDENTIFIER') {
            typeParts.push(this.advance().lexeme);
        }
        let type = typeParts.join(' ');
        let idNode = this.matchType('IDENTIFIER');
        let id = idNode ? idNode.lexeme : 'anon';
        return { name: 'Param', type, id, children: [{ name: `${type} ${id}`, isLeaf: true }] };
    }

    parseBlock() {
        this.expectLex('{');
        let node = { name: 'Block', children: [] };
        while (this.peek() && this.peek().lexeme !== '}') {
            node.children.push(this.parseStatement());
        }
        this.expectLex('}');
        return node;
    }

    sync() {
        let errToken = this.peek() || { lexeme: 'EOF' };
        while (this.peek() && ![';', '{', '}'].includes(this.peek().lexeme)) this.advance();
        if (this.peek()?.lexeme === ';') this.advance();
    }

    parseStatement() {
        try {
            const t = this.peek();
            if (!t) throw new CompilerError('EOF');
            if (t.lexeme === '{') return this.parseBlock();
            if (['int', 'float', 'double', 'char', 'string', 'bool', 'void', 'long', 'short'].includes(t.lexeme)) return this.parseVarDecl();
            if (t.lexeme === 'if') return this.parseIf();
            if (t.lexeme === 'while') return this.parseWhile();
            if (t.lexeme === 'for') return this.parseFor();
            if (t.lexeme === 'return') return this.parseReturn();
            if (t.lexeme === 'break') { this.advance(); this.expectLex(';'); return { name: 'Break', isLeaf: true }; }
            if (t.lexeme === 'continue') { this.advance(); this.expectLex(';'); return { name: 'Continue', isLeaf: true }; }
            if (t.lexeme === 'cout') return this.parseCout();
            if (t.lexeme === 'cin') return this.parseCin();
            if (t.lexeme === 'try') return this.parseTryCatch();
            if (t.lexeme === 'throw') return this.parseThrow();
            
            if (t.type === 'IDENTIFIER') {
                let start = this.pos;
                this.advance();
                
                // Track standard scopes like std::string 
                while (this.matchLex('::')) this.advance();
                
                // If it looks like a variable declaration of custom class (MyClass obj;)
                if (this.peek()?.type === 'IDENTIFIER') {
                    this.pos = start;
                    return this.parseVarDecl();
                }

                while (this.matchLex('[')) { this.parseExpression(); this.expectLex(']'); }
                while (this.matchLex('.')) this.advance();
                while (this.matchLex('->')) this.advance();

                let isAssign = this.peek()?.lexeme === '=' || ['+=', '-=', '*=', '/=', '%='].includes(this.peek()?.lexeme);
                let isUnAss = ['++', '--'].includes(this.peek()?.lexeme);
                this.pos = start;
                if (isAssign || isUnAss) return this.parseAssignment();
                else return this.parseExpressionStmt();
            }

            throw new CompilerError(`Unexpected token '${t.lexeme}'`);
        } catch (e) {
            this.sync(); return { name: `Unhandled Sync`, isLeaf: true, isErrorNode: true };
        }
    }

    parseTryCatch() {
        this.expectLex('try');
        let body = this.parseBlock();
        let catches = [];
        while (this.matchLex('catch')) {
            this.expectLex('(');
            let excType = this.advance().lexeme;
            let excId = this.expectType('IDENTIFIER').lexeme;
            this.expectLex(')');
            catches.push({ type: excType, id: excId, body: this.parseBlock() });
        }
        return { name: 'TryCatch', body, catches, children: [body, ...catches.map(c => c.body)] };
    }

    parseThrow() {
        this.expectLex('throw');
        let expr = this.parseExpression();
        this.expectLex(';');
        return { name: 'Throw', expr, children: [expr] };
    }

    parseVarDecl() {
        let typeParts = [];
        while (this.peek() && (['int', 'float', 'double', 'char', 'string', 'bool', 'void', 'long', 'short', 'unsigned', 'const'].includes(this.peek().lexeme) || this.peek().type === 'IDENTIFIER' || this.peek().lexeme === '::')) {
            typeParts.push(this.advance().lexeme);
            if (this.peek() && !['*','&', 'IDENTIFIER'].includes(this.peek().type)) break; // Prevent overconsumption
        }
        let pStr = '';
        while (this.matchLex('*')) pStr += '*';
        while (this.matchLex('&')) pStr += '&';

        let type = typeParts.join('') + pStr;
        let idNode = this.expectType('IDENTIFIER');
        let id = idNode.lexeme;
        
        let node = { name: 'VarDecl', typeInfo: type, id };
        if (this.matchLex('[')) {
            node.arraySize = this.parseExpression();
            this.expectLex(']');
        }

        if (this.matchLex('=')) {
            if (this.matchLex('new')) {
                let allocType = this.advance().lexeme;
                if (this.matchLex('[')) { this.parseExpression(); this.expectLex(']'); }
                else if (this.matchLex('(')) { this.expectLex(')'); }
                node.expr = { name: 'new', allocator: allocType, isLeaf: true };
            } else {
                node.expr = this.parseExpression();
            }
        }
        this.expectLex(';');
        node.children = [{ name: type, isLeaf: true }, { name: id, isLeaf: true }];
        if (node.expr) node.children.push(node.expr);
        return node;
    }

    parseAssignment() {
        let idNode = this.advance(); let id = idNode.lexeme;
        while (this.matchLex('[')) { id += `[${this.parseExpression().name || 'idx'}]`; this.expectLex(']'); }
        while (this.matchLex('.')) { id += `.${this.expectType('IDENTIFIER').lexeme}`; }
        while (this.matchLex('->')) { id += `->${this.expectType('IDENTIFIER').lexeme}`; }

        let op = this.advance().lexeme; 
        if (op === '++' || op === '--') {
            this.expectLex(';'); return { name: 'AssignUn', id, op, children: [{name: id, isLeaf: true}] };
        }

        let expr = null;
        if (this.matchLex('new')) {
            let allocType = this.advance().lexeme;
            if (this.matchLex('[')) { this.parseExpression(); this.expectLex(']'); }
            else if (this.matchLex('(')) { this.expectLex(')'); }
            expr = { name: 'new', allocator: allocType, isLeaf: true };
        } else {
            expr = this.parseExpression();
        }
        this.expectLex(';');
        return { name: 'Assign', id, op, expr, children: [{name: id, isLeaf: true}, expr] };
    }

    parseCout() {
        this.expectLex('cout');
        let streamItems = [];
        while (this.matchLex('<<')) {
            let t = this.peek();
            if (t && t.lexeme === 'endl') {
                this.advance(); streamItems.push({ name: 'endl', isLeaf: true, typeClass: 'KEYWORD' });
            } else streamItems.push(this.parseExpression());
        }
        this.expectLex(';'); return { name: 'Cout', children: streamItems };
    }

    parseCin() {
        this.expectLex('cin');
        let streamItems = [];
        while (this.matchLex('>>')) {
            streamItems.push(this.parseExpression());
        }
        this.expectLex(';'); return { name: 'Cin', children: streamItems };
    }

    parseIf() {
        this.expectLex('if'); this.expectLex('('); let cond = this.parseExpression(); this.expectLex(')');
        let body = this.parseStatement();
        let node = { name: 'If', cond, body, children: [cond, body] };
        if (this.matchLex('else')) {
            let elseBody = this.parseStatement();
            node.elseBody = elseBody; node.children.push(elseBody);
        }
        return node;
    }

    parseWhile() {
        this.expectLex('while'); this.expectLex('('); let cond = this.parseExpression(); this.expectLex(')');
        let body = this.parseStatement(); return { name: 'While', cond, body, children: [cond, body] };
    }

    parseFor() {
        this.expectLex('for'); this.expectLex('(');
        let init = null;
        if (this.peek()?.lexeme !== ';') {
            if (['int', 'float', 'double', 'long', 'short', 'unsigned'].includes(this.peek()?.lexeme)) init = this.parseVarDecl();
            else init = this.parseAssignment(); 
        } else this.expectLex(';');
        
        let cond = null;
        if (this.peek()?.lexeme !== ';') cond = this.parseExpression();
        this.expectLex(';');

        let inc = null;
        if (this.peek()?.lexeme !== ')') {
            let id = this.advance().lexeme;
            let op = this.advance().lexeme;
            if (op === '++' || op === '--') inc = { name: 'AssignUn', id, op };
            else inc = { name: 'AssignInc', id, op, expr: this.parseExpression() };
        }
        this.expectLex(')');
        let body = this.parseStatement();
        return { name: 'For', init, cond, inc, body, children: [init, cond, inc, body].filter(Boolean) };
    }

    parseReturn() {
        this.expectLex('return');
        let expr = null;
        if (this.peek() && this.peek().lexeme !== ';') expr = this.parseExpression();
        this.expectLex(';'); return { name: 'Return', expr, children: expr ? [expr] : [] };
    }

    parseExpressionStmt() {
        let expr = this.parseExpression();
        this.expectLex(';'); return { name: 'ExprStmt', expr, children: [expr] };
    }

    parseExpression() { return this.parseLogical(); }
    parseLogical() {
        let node = this.parseBitwise();
        while (this.peek() && (this.peek().lexeme === '&&' || this.peek().lexeme === '||')) {
            let op = this.advance().lexeme; let right = this.parseBitwise();
            node = { name: op, op, left: node, right, children: [node, right] };
        }
        return node;
    }
    parseBitwise() {
        let node = this.parseRelational();
        while (this.peek() && ['&', '|', '^', '<<', '>>'].includes(this.peek().lexeme)) {
            let op = this.advance().lexeme; let right = this.parseRelational();
            node = { name: op, op, left: node, right, children: [node, right] };
        }
        return node;
    }
    parseRelational() {
        let node = this.parseAdditive();
        const relOps = ['<', '>', '<=', '>=', '==', '!='];
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
        while (this.peek() && (this.peek().lexeme === '*' || this.peek().lexeme === '/' || this.peek().lexeme === '%')) {
            let op = this.advance().lexeme; let right = this.parseFactor();
            node = { name: op, op, left: node, right, children: [node, right] };
        }
        return node;
    }
    parseFactor() {
        if (this.matchLex('(')) {
            let node = this.parseExpression(); this.expectLex(')'); return node;
        }
        let t = this.peek();
        if (!t) throw new CompilerError('Unexpected EOF in expression');
        
        if (['INT_CONST', 'FLOAT_CONST', 'STRING', 'CHAR_LITERAL', 'IDENTIFIER'].includes(t.type)) {
            let node = this.advance();
            if (node.type === 'IDENTIFIER' && this.matchLex('.')) {
                let method = this.expectType('IDENTIFIER').lexeme;
                if (this.matchLex('(')) {
                    let args = [];
                    if (this.peek() && this.peek().lexeme !== ')') {
                        args.push(this.parseExpression());
                        while (this.matchLex(',')) args.push(this.parseExpression());
                    }
                    this.expectLex(')');
                    return { name: `${node.lexeme}.${method}()`, obj: node.lexeme, method, args, children: args };
                }
            }
            if (node.type === 'IDENTIFIER' && this.matchLex('(')) {
                let args = [];
                if (this.peek() && this.peek().lexeme !== ')') {
                    args.push(this.parseExpression());
                    while (this.matchLex(',')) args.push(this.parseExpression());
                }
                this.expectLex(')');
                return { name: `${node.lexeme}()`, id: node.lexeme, args, children: args };
            }
            if (node.type === 'IDENTIFIER' && this.matchLex('[')) {
                let idx = this.parseExpression(); this.expectLex(']');
                return { name: `ArrayRef`, id: node.lexeme, isLeaf: true, children: [idx] };
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
    let memOffset = 0;
    let currentScopeLevel = 0;

    function enterScope() { currentScopeLevel++; symbolMapStack.push(new Map()); }
    function exitScope() { symbolMapStack.pop(); currentScopeLevel--; }
    function lookup(name) { for (let i = symbolMapStack.length - 1; i >= 0; i--) if (symbolMapStack[i].has(name)) return symbolMapStack[i].get(name); return null; }

    function traverse(node) {
        if (!node) return;
        if (node.name === 'Program') {
            node.children.forEach(traverse);
        } else if (node.name === 'Header') {
            logs.push(`C++ Namespace/Macro Linked: ${node.id}`);
        } else if (node.name === 'Class') {
            let sym = { name: node.id, type: 'class', scopeLevel: currentScopeLevel, mem: 'global' };
            symbolMapStack[symbolMapStack.length - 1].set(node.id, sym);
            flatSymbolTable.push(sym);
            logs.push(`Class [${node.id}] context established`);
            enterScope(); traverse(node.body); exitScope();
        } else if (node.name === 'Function' || node.name === 'MainFunction') {
            let sym = { name: node.id, type: 'function -> ' + node.returnType, scopeLevel: currentScopeLevel, mem: 'code' };
            symbolMapStack[symbolMapStack.length - 1].set(node.id, sym);
            flatSymbolTable.push(sym);
            logs.push(`Function [${node.id}] declared`);
            enterScope();
            if (node.params) node.params.forEach(p => {
                let pSym = { name: p.id, type: p.type, scopeLevel: currentScopeLevel, mem: 'param' };
                symbolMapStack[symbolMapStack.length - 1].set(p.id, pSym);
                flatSymbolTable.push(pSym);
            });
            traverse(node.body);
            exitScope();
        } else if (node.name === 'VarDecl') {
            if (symbolMapStack[symbolMapStack.length - 1].has(node.id)) logs.push(`Warning: Duplicate C++ declaration [${node.id}]`);
            let sym = { name: node.id, type: node.arraySize ? 'array' : node.typeInfo, scopeLevel: currentScopeLevel, mem: `0x${memOffset.toString(16).padStart(4, '0')}` };
            symbolMapStack[symbolMapStack.length - 1].set(node.id, sym);
            flatSymbolTable.push(sym);
            memOffset += node.arraySize ? 8 : 4;
            logs.push(`Variable/Instance [${node.id}] declared`);
            if (node.expr) traverse(node.expr);
        } else if (node.name === 'TryCatch') {
            enterScope(); logs.push("Exception Block Bounded");
            traverse(node.body); exitScope();
            node.catches.forEach(c => { enterScope(); traverse(c.body); exitScope(); });
        } else if (node.name.startsWith('Assign')) {
            let baseId = node.id.split('[')[0].split('.')[0].split('->')[0];
            if (!lookup(baseId)) logs.push(`Warning: Reference [${baseId}] assigned before declaration.`);
            if (node.expr) traverse(node.expr);
        } else if (node.name.endsWith('()') && node.id) {
            if (!lookup(node.id) && !['cout', 'cin'].includes(node.id)) {
                logs.push(`Function [${node.id}] dynamically linked`);
            }
            if (node.args) node.args.forEach(traverse);
        } else {
            if (node.children && node.name !== 'Class') node.children.forEach(traverse);
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
        else if (['+', '-', '*', '/', '%', '&', '|', '^', '<', '>', '<=', '>=', '==', '!=', '&&', '||', '<<', '>>'].includes(op)) tac.push(`${res} = ${arg1} ${op} ${arg2}`);
        else if (op === 'ifFalse') tac.push(`ifFalse ${arg1} goto ${res}`);
        else if (op === 'goto') tac.push(`goto ${res}`);
        else if (op === 'label') tac.push(`${res}:`);
        else if (op === 'print') tac.push(`print ${arg1}`);
        else if (op === 'input') tac.push(`input into ${res}`);
        else if (op === 'param') tac.push(`param ${arg1}`);
        else if (op === 'call') tac.push(`${res} = call ${arg1}, ${arg2}`);
        else if (op === 'return') tac.push(`return ${arg1}`);
        else if (op === 'throw') tac.push(`throw ${arg1}`);
    }

    let loops = [];

    function genExpr(node) {
        if (!node) return '';
        if (node.isLeaf) return node.name;
        
        if (node.obj && node.method) {
            if (node.args) node.args.forEach(arg => emit('param', genExpr(arg), '', ''));
            let t = newTemp(); emit('call', `${node.obj}.${node.method}`, node.args ? node.args.length : 0, t); return t;
        }

        if (node.id && node.name.endsWith('()')) {
            if (node.args) node.args.forEach(arg => emit('param', genExpr(arg), '', ''));
            let t = newTemp(); emit('call', node.id, node.args ? node.args.length : 0, t); return t;
        }

        let left = genExpr(node.left);
        let right = genExpr(node.right);
        let t = newTemp(); emit(node.op, left, right, t); return t;
    }

    function genStmt(node) {
        if (!node) return;
        if (node.name === 'Program' || node.name === 'ClassBody' || node.name === 'Block' || node.name === 'Class') {
            if (node.children) node.children.forEach(genStmt);
            if (node.name === 'Class' && node.body) genStmt(node.body);
        } else if (node.name === 'Function' || node.name === 'MainFunction') {
            emit('label', '', '', node.id); genStmt(node.body);
        } else if (node.name === 'VarDecl' && node.expr) {
            emit('=', genExpr(node.expr), '', node.id);
        } else if (node.name === 'Assign') {
            emit('=', genExpr(node.expr), '', node.id);
        } else if (node.name === 'AssignUn') {
            let t = newTemp();
            if (node.op === '++') emit('+', node.id, '1', t);
            if (node.op === '--') emit('-', node.id, '1', t);
            emit('=', t, '', node.id);
        } else if (node.name === 'AssignInc') {
            let t = newTemp(); let pureOp = node.op.replace('=', '');
            emit(pureOp, node.id, genExpr(node.expr), t); emit('=', t, '', node.id);
        } else if (node.name === 'Cout') {
            node.children.forEach(child => {
                if (child.name === 'endl') emit('print', '"\\n"', '', '');
                else emit('print', genExpr(child), '', '');
            });
        } else if (node.name === 'Cin') {
            node.children.forEach(child => emit('input', '', '', genExpr(child)));
        } else if (node.name === 'If') {
            let condVar = genExpr(node.cond);
            let lElse = newLabel(), lEnd = newLabel();
            emit('ifFalse', condVar, '', lElse);
            genStmt(node.body); emit('goto', '', '', lEnd);
            emit('label', '', '', lElse);
            if (node.elseBody) genStmt(node.elseBody);
            emit('label', '', '', lEnd);
        } else if (node.name === 'While') {
            let lStart = newLabel(), lEnd = newLabel(); loops.push({start: lStart, end: lEnd});
            emit('label', '', '', lStart);
            let condVar = genExpr(node.cond);
            emit('ifFalse', condVar, '', lEnd);
            genStmt(node.body); emit('goto', '', '', lStart);
            emit('label', '', '', lEnd); loops.pop();
        } else if (node.name === 'For') {
            let lStart = newLabel(), lEnd = newLabel(), lInc = newLabel(); loops.push({start: lInc, end: lEnd});
            if (node.init) genStmt(node.init);
            emit('label', '', '', lStart);
            let condVar = '1'; if (node.cond) condVar = genExpr(node.cond);
            emit('ifFalse', condVar, '', lEnd);
            genStmt(node.body);
            emit('label', '', '', lInc);
            if (node.inc) genStmt(node.inc);
            emit('goto', '', '', lStart);
            emit('label', '', '', lEnd); loops.pop();
        } else if (node.name === 'Break') {
            if (loops.length > 0) emit('goto', '', '', loops[loops.length - 1].end);
        } else if (node.name === 'Continue') {
            if (loops.length > 0) emit('goto', '', '', loops[loops.length - 1].start);
        } else if (node.name === 'TryCatch') {
            let tryLbl = newLabel(), catchLbl = newLabel(), endLbl = newLabel();
            emit('label', '', '', tryLbl); genStmt(node.body); emit('goto', '', '', endLbl);
            emit('label', '', '', catchLbl); node.catches.forEach(c => genStmt(c.body));
            emit('label', '', '', endLbl);
        } else if (node.name === 'Throw') {
            emit('throw', genExpr(node.expr), '', '');
        } else if (node.name === 'Return') {
            emit('return', node.expr ? genExpr(node.expr) : '', '', '');
        } else if (node.name === 'ExprStmt') {
            genExpr(node.expr);
        }
    }
    genStmt(ast);
    return { quads, tac };
}

// --- Diagram Generation ---
export function getCPPDiagrams() {
    return {
        dfa: `stateDiagram-v2\n[*] --> S0\nS0 --> PREPROC : '#'\nPREPROC --> PREPROC : [a-z]\nPREPROC --> [*] : newline\nS0 --> S1 : [a-zA-Z_]\nS1 --> S1 : [a-zA-Z0-9_]\nS1 --> [*] : C++ Keyword\nS0 --> S2 : [0-9]\nS2 --> S2 : [0-9]\nS2 --> [*] : Number`,
        nfa: `graph LR\nS((Start)) -->|#| P(Preproc)\nS -->|letter| I(Ident)\nS -->|digit| N(Num)\nI --> End\nN --> End\nP --> End`
    };
}

export function compileCPP(code) {
    const tokens = lexer(code);
    const ast = new Parser(tokens).parse();
    const semantics = analyzeSemantics(ast);
    const icg = generateICG(ast);
    const opt = optimize(icg.quads);
    const asm = generateASM(opt.quads);
    const diagrams = getCPPDiagrams();
    return { tokens, ast, semantics, icg, opt, asm, diagrams };
}
