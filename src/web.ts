import loader from "@assemblyscript/loader";
import wasmPath from "url:../build/optimized.wasm";
// import wasmPath from "url:../build/untouched.wasm";

function timeout(ms: number) {
  return new Promise((resolve) => {
    console.debug(`timeout ${ms}ms`);
    setTimeout(resolve, ms);
  });
}

(async () => {
  console.clear();
  console.debug("init");
  const importObject = {
    env: {
      abort() {
        console.error("abort");
      },
    },
  };
  const module = await loader.instantiateStreaming(
    fetch(wasmPath),
    importObject
  );
  console.debug(`wasm module loaded and ready`, module);

  const { runBaseImplementation } = await import("./baseImplementation");
  const { runWasmImplementation } = await import("./wasmImplementation");
  await timeout(1000);

  const warmupCount = 10;
  const runCount = 1000;
  console.debug(`start benchmark`);
  await runBaseImplementation(runCount, warmupCount);
  await timeout(1000);
  await runWasmImplementation(runCount, warmupCount, module.exports);
  await timeout(1000);
  console.debug(`end benchmark`);
})();
