import loader from "@assemblyscript/loader";
import wasmPath from "url:../build/optimized.wasm";

function timeout(ms: number) {
  return new Promise((resolve) => {
    console.debug(`timeout ${ms}ms`);
    setTimeout(resolve, ms);
  });
}

(async () => {
  console.clear();
  console.debug("init");
  const importObject = {};
  const module = await loader.instantiateStreaming(
    fetch(wasmPath),
    importObject
  );
  console.debug(`wasm module loaded and ready`, module);

  const { runBaseImplementation } = await import("./baseImplementation");
  const { runWasmImplementation } = await import("./wasmImplementation");
  await timeout(1000);

  const warmupCount = 1000;
  const runCount = 10000;
  console.debug(`start benchmark`);
  await runBaseImplementation(runCount, warmupCount);
  await timeout(1000);
  await runWasmImplementation(runCount, warmupCount, module.exports);
  console.debug(`end benchmark`);
})();
