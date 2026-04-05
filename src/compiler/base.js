// ==========================================
// SHARED COMPILER UTILITIES & BASE LOGIC
// ==========================================

export class CompilerError extends Error {
    constructor(message, line, col) {
        super(message);
        this.line = line;
        this.col = col;
    }
}

// --- Shared Code Optimization ---
export function optimize(quads) {
    let optQuads = [];
    let tac = [];
    let strategies = new Set();
    let constants = {};

    // Pass 1: Constant Folding & Propagation
    for (let q of quads) {
        let { op } = q;
        let arg1 = q.arg1, arg2 = q.arg2, res = q.res;

        if (constants[arg1] !== undefined) {
            strategies.add(`Constant Propagation: Replaced ${arg1} with ${constants[arg1]}`);
            arg1 = constants[arg1];
        }
        if (constants[arg2] !== undefined) {
            strategies.add(`Constant Propagation: Replaced ${arg2} with ${constants[arg2]}`);
            arg2 = constants[arg2];
        }

        if (['+', '-', '*', '/'].includes(op) && !isNaN(arg1) && !isNaN(arg2)) {
            // eslint-disable-next-line no-eval
            let resultVal = eval(`${arg1} ${op} ${arg2}`);
            strategies.add(`Constant Folding: ${arg1} ${op} ${arg2} -> ${resultVal}`);
            optQuads.push({ op: '=', arg1: resultVal, arg2: '', res });
            constants[res] = resultVal;
        } else if (op === '=' && !isNaN(arg1)) {
            constants[res] = arg1;
            optQuads.push({ op, arg1, arg2, res });
        } else {
            if (res && res !== '' && isNaN(arg1)) delete constants[res];
            optQuads.push({ op, arg1, arg2, res });
        }
    }

    // Pass 2: Dead Code Elimination
    let used = new Set();
    for (let q of optQuads) {
        if (q.arg1) used.add(String(q.arg1));
        if (q.arg2) used.add(String(q.arg2));
        if (q.op === 'ifFalse' || q.op === 'print') used.add(String(q.arg1));
    }

    let finalQuads = [];
    for (let q of optQuads) {
        if (q.res && q.res.startsWith('t') && !used.has(q.res) && !['label', 'goto', 'print'].includes(q.op)) {
            strategies.add(`Dead Code Elimination: Removed unused assignment to ${q.res}`);
            continue;
        }
        finalQuads.push(q);
        const { op, arg1, arg2, res } = q;
        if (op === '=') tac.push(`${res} = ${arg1}`);
        else if (['+', '-', '*', '/', '<', '>', '<=', '>=', '==', '!=', '&&', '||'].includes(op))
            tac.push(`${res} = ${arg1} ${op} ${arg2}`);
        else if (op === 'ifFalse') tac.push(`ifFalse ${arg1} goto ${res}`);
        else if (op === 'goto') tac.push(`goto ${res}`);
        else if (op === 'label') tac.push(`${res}:`);
        else if (op === 'print') tac.push(`print ${arg1}`);
    }

    if (strategies.size === 0) strategies.add('No major optimizations applicable.');
    return { quads: finalQuads, tac, strategies: Array.from(strategies) };
}

// --- Shared Code Generation (Intel 8085 Assembly) ---
export function generateASM(quads) {
    let instructions = [];
    let memoryAddr = 0x2000;

    function emitInst(inst, ops = '', comment = '') {
        let size = 1;
        if (['LDA', 'STA', 'JMP', 'JZ', 'JNZ', 'CALL'].includes(inst)) size = 3;
        else if (['MVI', 'ADI', 'SUI', 'CPI', 'OUT'].includes(inst)) size = 2;
        const addrStr = memoryAddr.toString(16).toUpperCase().padStart(4, '0');
        instructions.push({ addr: addrStr, inst, ops, comment, isLabel: false });
        memoryAddr += size;
    }

    function emitLabel(label) {
        instructions.push({ addr: '', inst: '', ops: '', comment: '', isLabel: true, label });
    }

    function loadToA(operand) {
        if (!isNaN(operand)) emitInst('MVI', `A, ${operand}H`, 'Load immediate to Accumulator');
        else emitInst('LDA', operand, 'Load variable to Accumulator');
    }

    function loadToB(operand) {
        if (!isNaN(operand)) emitInst('MVI', `B, ${operand}H`, 'Load immediate to B reg');
        else { emitInst('LDA', operand); emitInst('MOV', 'B, A', 'Move A to B'); }
    }

    for (let q of quads) {
        if (q.op === 'label') {
            emitLabel(q.res);
        } else if (q.op === '=') {
            loadToA(q.arg1);
            emitInst('STA', q.res, `Store Accumulator to ${q.res}`);
        } else if (['+', '-', '*', '/'].includes(q.op)) {
            if (q.op === '+') {
                if (!isNaN(q.arg2)) { loadToA(q.arg1); emitInst('ADI', `${q.arg2}H`, 'Add immediate to A'); }
                else { loadToB(q.arg2); loadToA(q.arg1); emitInst('ADD', 'B', 'Add register B to A'); }
            } else if (q.op === '-') {
                if (!isNaN(q.arg2)) { loadToA(q.arg1); emitInst('SUI', `${q.arg2}H`, 'Subtract immediate from A'); }
                else { loadToB(q.arg2); loadToA(q.arg1); emitInst('SUB', 'B', 'Subtract register B from A'); }
            } else if (q.op === '*' || q.op === '/') {
                loadToB(q.arg2); loadToA(q.arg1);
                emitInst('CALL', q.op === '*' ? 'MULT' : 'DIV', '8085 simulated operation subroutine');
            }
            emitInst('STA', q.res);
        } else if (['<', '>', '<=', '>=', '==', '!='].includes(q.op)) {
            loadToB(q.arg2); loadToA(q.arg1);
            emitInst('CMP', 'B', 'Compare B with A (Sets flags)');
            emitInst('STA', q.res, 'Store condition flag state');
        } else if (q.op === 'ifFalse') {
            loadToA(q.arg1);
            emitInst('CPI', '00H', 'Compare A with 0');
            emitInst('JZ', q.res, 'Jump if Zero flag is set');
        } else if (q.op === 'goto') {
            emitInst('JMP', q.res, 'Unconditional jump');
        } else if (q.op === 'print') {
            loadToA(q.arg1);
            emitInst('OUT', '01H', 'Output to port 01 (Display)');
        }
    }
    emitInst('HLT', '', 'Halt Processor');
    return instructions;
}
