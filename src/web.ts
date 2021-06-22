import loader from "@assemblyscript/loader";
import optimizedPath from "url:../build/optimized.wasm";
import untouchedPath from "url:../build/untouched.wasm";

function timeout(ms: number) {
  return new Promise((resolve) => {
    // console.debug(`timeout ${ms}ms`);
    setTimeout(resolve, ms);
  });
}

(async () => {
  // console.clear();
  console.debug("init");
  const importObject = {
    env: {
      abort() {
        console.error("abort");
      },
    },
  };

  const untouchedModule = await loader.instantiateStreaming(
    fetch(untouchedPath),
    importObject
  );
  console.debug(`untouched module loaded and ready`, untouchedModule);
  const optimisedModule = await loader.instantiateStreaming(
    fetch(optimizedPath),
    importObject
  );
  console.debug(`optimised module loaded and ready`, optimisedModule);

  const { runBaseImplementation } = await import("./baseImplementation");
  const { runWasmImplementation } = await import("./wasmImplementation");
  console.debug(`implementations loaded and ready`);
  await timeout(5000);

  const warmupCount = 1000;
  const runCount = 10000;
  const chunkSize = 100000;

  await runBaseImplementation(runCount, warmupCount, chunkSize);
  await timeout(5000);

  await runWasmImplementation(
    runCount,
    warmupCount,
    untouchedModule.exports,
    chunkSize,
    "untouched"
  );
  await timeout(5000);
  await runWasmImplementation(
    runCount,
    warmupCount,
    optimisedModule.exports,
    chunkSize,
    "optimised"
  );
  await timeout(5000);

  console.debug(`end benchmark`);
})();
