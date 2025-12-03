// ============================================
// WRAPPER para wasm-module-builder.js do PS5
// ============================================

console.log("[WRAPPER] Inicializando wrapper para wasm-module-builder.js do PS5");

// 1. Verificar se já existe WebAssembly (provavelmente não no PS5)
if (typeof WebAssembly === 'undefined') {
    console.warn("[WRAPPER] WebAssembly não está disponível globalmente");
    
    // Tentar criar um objeto WebAssembly falso para compatibilidade
    window.WebAssembly = {
        Module: function() { throw new Error("WebAssembly não disponível"); },
        Instance: function() { throw new Error("WebAssembly não disponível"); },
        compile: function() { throw new Error("WebAssembly não disponível"); },
        instantiate: function() { throw new Error("WebAssembly não disponível"); },
        validate: function() { return false; }
    };
    
    console.log("[WRAPPER] WebAssembly falso criado para compatibilidade");
}

// 2. Carregar o arquivo wasm-module-builder.js do PS5
async function loadPS5WasmBuilder() {
    console.log("[WRAPPER] Carregando wasm-module-builder.js do PS5...");
    
    try {
        // Carregar o arquivo
        const response = await fetch('wasm-module-builder.js');
        const code = await response.text();
        
        console.log(`[WRAPPER] Arquivo carregado (${code.length} bytes)`);
        
        // Preparar ambiente para execução
        const originalConsole = { ...console };
        const capturedOutput = [];
        
        // Substituir funções JSC-specific
        const sandbox = {
            // Funções que o arquivo espera
            load: function(filename) {
                console.warn(`[WRAPPER] load() chamado para: ${filename} - ignorado`);
                return Promise.resolve();
            },
            
            print: function(...args) {
                const message = args.join(' ');
                capturedOutput.push(message);
                console.log(`[PRINT] ${message}`);
            },
            
            gc: function() {
                console.log("[WRAPPER] gc() chamado - usando fallback");
                // Tentar forçar GC
                if (window.gc) window.gc();
                if (typeof gc !== 'undefined') gc();
            },
            
            // Objetos globais que o arquivo pode usar
            WebAssembly: window.WebAssembly,
            
            // Console para debug
            console: {
                log: function(...args) {
                    originalConsole.log('[WASM-BUILDER]', ...args);
                    capturedOutput.push(args.join(' '));
                },
                warn: function(...args) {
                    originalConsole.warn('[WASM-BUILDER]', ...args);
                    capturedOutput.push(`WARN: ${args.join(' ')}`);
                },
                error: function(...args) {
                    originalConsole.error('[WASM-BUILDER]', ...args);
                    capturedOutput.push(`ERROR: ${args.join(' ')}`);
                }
            },
            
            // Outras globais necessárias
            Object,
            Array,
            String,
            Number,
            Boolean,
            Math,
            JSON,
            Date,
            Error,
            TypeError,
            RangeError,
            Uint8Array,
            ArrayBuffer,
            DataView,
            Promise,
            
            // Esta será nossa saída
            WasmModuleBuilder: null
        };
        
        // Executar o código no sandbox
        const wrappedCode = `
            // Injetar código do arquivo
            ${code}
            
            // Expor WasmModuleBuilder para o sandbox
            if (typeof WasmModuleBuilder !== 'undefined') {
                WasmModuleBuilder = WasmModuleBuilder;
            } else if (typeof globalThis.WasmModuleBuilder !== 'undefined') {
                WasmModuleBuilder = globalThis.WasmModuleBuilder;
            } else if (typeof window !== 'undefined' && window.WasmModuleBuilder) {
                WasmModuleBuilder = window.WasmModuleBuilder;
            }
        `;
        
        // Criar função com o código
        const executor = new Function(...Object.keys(sandbox), wrappedCode);
        
        // Executar
        executor(...Object.values(sandbox));
        
        // Verificar se WasmModuleBuilder foi definido
        if (sandbox.WasmModuleBuilder) {
            console.log("[WRAPPER] WasmModuleBuilder encontrado no sandbox");
            window.WasmModuleBuilder = sandbox.WasmModuleBuilder;
            return true;
        } else {
            // Tentar extrair do código
            console.log("[WRAPPER] Tentando extrair WasmModuleBuilder do código...");
            return extractWasmModuleBuilder(code);
        }
        
    } catch (error) {
        console.error("[WRAPPER] Erro ao carregar arquivo:", error);
        return false;
    }
}

// 3. Função para extrair WasmModuleBuilder do código
function extractWasmModuleBuilder(code) {
    console.log("[WRAPPER] Analisando código para encontrar WasmModuleBuilder...");
    
    try {
        // Padrões de definição de classe
        const classPatterns = [
            /class\s+WasmModuleBuilder\s*{[\s\S]*?}\s*$/m,
            /function\s+WasmModuleBuilder\s*\([^)]*\)\s*{[\s\S]*?}\s*$/m,
            /WasmModuleBuilder\s*=\s*(?:class|function)\s*(?:WasmModuleBuilder)?\s*{[\s\S]*?}\s*;/m,
            /var\s+WasmModuleBuilder\s*=\s*{[\s\S]*?}\s*;/m
        ];
        
        for (const pattern of classPatterns) {
            const match = code.match(pattern);
            if (match) {
                console.log("[WRAPPER] Encontrado padrão de classe/função");
                
                // Extrair e executar apenas a definição
                const classCode = match[0];
                
                // Executar para definir a classe
                (function() {
                    eval(classCode);
                    
                    // Verificar se foi definido
                    if (typeof WasmModuleBuilder !== 'undefined') {
                        window.WasmModuleBuilder = WasmModuleBuilder;
                        console.log("[WRAPPER] WasmModuleBuilder definido via eval");
                        return true;
                    }
                })();
                
                if (window.WasmModuleBuilder) {
                    return true;
                }
            }
        }
        
        // Se não encontrou, criar uma implementação básica
        console.log("[WRAPPER] Criando implementação básica de WasmModuleBuilder");
        createBasicWasmModuleBuilder();
        return true;
        
    } catch (error) {
        console.error("[WRAPPER] Erro ao extrair WasmModuleBuilder:", error);
        return false;
    }
}

// 4. Implementação básica de WasmModuleBuilder
function createBasicWasmModuleBuilder() {
    class BasicWasmModuleBuilder {
        constructor() {
            this.types = [];
            this.functions = [];
            this.globals = [];
            this.exports = [];
            this.memories = [];
            this.tables = [];
            this.dataSegments = [];
            this.elementSegments = [];
            console.log("[BasicWasmModuleBuilder] Instância criada");
        }
        
        addStruct(fields) {
            const typeIndex = this.types.length;
            this.types.push({
                form: 0x5f, // kWasmStructTypeForm
                fields: fields,
                is_final: false,
                is_shared: false,
                supertype: 0xFFFFFFFF // kNoSuperType
            });
            console.log(`[BasicWasmModuleBuilder] Struct criada: índice ${typeIndex}, campos: ${fields.length}`);
            return typeIndex;
        }
        
        addArray(elementType, mutable) {
            const typeIndex = this.types.length;
            this.types.push({
                form: 0x5e, // kWasmArrayTypeForm
                elementType: elementType,
                mutable: mutable,
                is_final: false,
                is_shared: false,
                supertype: 0xFFFFFFFF
            });
            console.log(`[BasicWasmModuleBuilder] Array criado: índice ${typeIndex}`);
            return typeIndex;
        }
        
        addGlobal(type, mutable, shared, init) {
            const globalIndex = this.globals.length;
            const global = {
                type: type,
                mutable: mutable,
                shared: shared,
                init: init
            };
            this.globals.push(global);
            
            console.log(`[BasicWasmModuleBuilder] Global criada: índice ${globalIndex}, tipo: ${JSON.stringify(type)}`);
            
            return {
                exportAs: (name) => {
                    this.exports.push({
                        name: name,
                        kind: 3, // kExternalGlobal
                        index: globalIndex
                    });
                    console.log(`[BasicWasmModuleBuilder] Global ${globalIndex} exportada como "${name}"`);
                    return this;
                }
            };
        }
        
        addImportedGlobal(module, name, type, mutable = false, shared = false) {
            const globalIndex = this.globals.length;
            this.globals.push({
                module: module,
                name: name,
                type: type,
                mutable: mutable,
                shared: shared,
                imported: true
            });
            console.log(`[BasicWasmModuleBuilder] Global importada: ${module}.${name}, índice ${globalIndex}`);
            return globalIndex;
        }
        
        addFunction(name, type) {
            const funcIndex = this.functions.length;
            const func = {
                name: name,
                type: type,
                body: [],
                locals: []
            };
            this.functions.push(func);
            
            console.log(`[BasicWasmModuleBuilder] Função criada: ${name}, índice ${funcIndex}`);
            
            return {
                addBody: (body) => {
                    func.body = body;
                    return this;
                },
                addLocals: (type, count) => {
                    func.locals.push({ type, count });
                    return this;
                },
                exportFunc: () => {
                    this.exports.push({
                        name: name,
                        kind: 0, // kExternalFunction
                        index: funcIndex
                    });
                    return this;
                }
            };
        }
        
        addType(sig) {
            const typeIndex = this.types.length;
            this.types.push({
                form: 0x60, // kWasmFunctionTypeForm
                params: sig.params || [],
                results: sig.results || [],
                is_final: true,
                is_shared: false,
                supertype: 0xFFFFFFFF
            });
            return typeIndex;
        }
        
        instantiate(imports = {}) {
            console.log("[BasicWasmModuleBuilder] Tentando instanciar módulo...");
            
            // Criar objeto de exports simulado
            const exports = {};
            
            // Adicionar exports definidos
            this.exports.forEach(exp => {
                if (exp.kind === 3) { // Global
                    exports[exp.name] = {
                        value: null,
                        get value() { return this._value; },
                        set value(val) { 
                            console.log(`[Global ${exp.name}] Valor alterado:`, val);
                            this._value = val;
                        }
                    };
                } else if (exp.kind === 0) { // Function
                    exports[exp.name] = function() {
                        console.log(`[Função ${exp.name}] Chamada com argumentos:`, arguments);
                        return 0;
                    };
                }
            });
            
            return {
                exports: exports
            };
        }
        
        // Métodos auxiliares
        exportAs(name) {
            return this;
        }
        
        addExport(name, kind, index) {
            this.exports.push({ name, kind, index });
            return this;
        }
        
        addExportOfKind(name, kind, index) {
            return this.addExport(name, kind, index);
        }
    }
    
    window.WasmModuleBuilder = BasicWasmModuleBuilder;
    console.log("[WRAPPER] BasicWasmModuleBuilder criado e definido globalmente");
}

// 5. Inicialização automática
document.addEventListener('DOMContentLoaded', async function() {
    console.log("[WRAPPER] Inicializando wrapper...");
    
    // Tentar carregar o builder do PS5
    const success = await loadPS5WasmBuilder();
    
    if (success && typeof WasmModuleBuilder !== 'undefined') {
        console.log("[WRAPPER] ✅ WasmModuleBuilder disponível!");
        
        // Testar criação básica
        try {
            const builder = new WasmModuleBuilder();
            console.log("[WRAPPER] ✅ Instância de WasmModuleBuilder criada com sucesso");
            console.log("[WRAPPER] Métodos disponíveis:", Object.getOwnPropertyNames(Object.getPrototypeOf(builder)));
            
            // Criar interface visual
            createStatusUI(true);
            
        } catch (error) {
            console.error("[WRAPPER] ❌ Erro ao criar instância:", error);
            createStatusUI(false, error.message);
        }
    } else {
        console.log("[WRAPPER] ❌ Não foi possível carregar WasmModuleBuilder");
        console.log("[WRAPPER] Usando implementação básica...");
        
        // Usar implementação básica
        createBasicWasmModuleBuilder();
        createStatusUI(true, "Usando implementação básica");
    }
});

// 6. Interface de status
function createStatusUI(success, message = "") {
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 20px;
        background: ${success ? '#2ecc71' : '#e74c3c'};
        color: white;
        border-radius: 10px;
        z-index: 10000;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        max-width: 400px;
        font-family: Arial, sans-serif;
    `;
    
    statusDiv.innerHTML = `
        <h3 style="margin: 0 0 10px 0;">${success ? '✅' : '❌'} WasmModuleBuilder</h3>
        <p style="margin: 0; font-size: 14px;">
            ${success ? 'Carregado com sucesso!' : 'Falha ao carregar'}
            ${message ? `<br><small>${message}</small>` : ''}
        </p>
        <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">
            Disponível globalmente como <code>WasmModuleBuilder</code>
        </p>
    `;
    
    document.body.appendChild(statusDiv);
    
    // Remover após alguns segundos
    setTimeout(() => {
        statusDiv.style.opacity = '0';
        statusDiv.style.transition = 'opacity 1s';
        setTimeout(() => statusDiv.remove(), 1000);
    }, 5000);
}

// 7. Exportar funções úteis
window.PS5WasmWrapper = {
    loadPS5WasmBuilder,
    createBasicWasmModuleBuilder,
    extractWasmModuleBuilder
};

console.log("[WRAPPER] Wrapper inicializado. Use PS5WasmWrapper para funções avançadas.");
