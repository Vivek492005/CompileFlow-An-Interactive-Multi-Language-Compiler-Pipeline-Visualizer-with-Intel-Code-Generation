// ==========================================
// CENTRAL COMPILER ENGINE (DISPATCHER)
// ==========================================

import { CompilerError } from './base';
import { compileC } from './c_engine';
import { compileCPP } from './cpp_engine';
import { compilePython } from './python_engine';

export { CompilerError };

/**
 * Master compile function that dispatches the request to the 
 * appropriate language-specific engine.
 */
export function compileAll(code, language = 'c') {
    console.log(`Compiling [${language.toUpperCase()}] code...`);
    
    switch (language.toLowerCase()) {
        case 'c':
            return compileC(code);
        case 'cpp':
            return compileCPP(code);
        case 'python':
            return compilePython(code);
        default:
            throw new CompilerError(`Unsupported language: ${language}`, 0, 0);
    }
}
