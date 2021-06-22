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

  // const { runBaseImplementation } = await import("./baseImplementation");
  const { runWasmImplementation } = await import("./wasmImplementation");
  console.debug(`implementations loaded and ready`);
  await timeout(5000);

  const warmupCount = 10;
  const runCount = 100;

  // await runBaseImplementation(runCount, warmupCount, 1000000);
  // await timeout(1000);
  // await runBaseImplementation(runCount, warmupCount, 5000);
  // await timeout(1000);
  // await runBaseImplementation(runCount, warmupCount, 10000);
  // await timeout(1000);
  // // await runBaseImplementation(runCount, warmupCount, 50000);
  // // await timeout(1000);
  // // await runBaseImplementation(runCount, warmupCount, 100000);
  // // await timeout(1000);

  await runWasmImplementation(
    runCount,
    warmupCount,
    untouchedModule.exports,
    1000000,
    "untouched"
  );
  await timeout(5000);
  await runWasmImplementation(
    runCount,
    warmupCount,
    optimisedModule.exports,
    1000000,
    "optimised"
  );
  await timeout(5000);
  // await runWasmImplementation(runCount, warmupCount, module.exports, 5000);
  // await timeout(1000);
  // await runWasmImplementation(runCount, warmupCount, module.exports, 10000);
  // await timeout(1000);
  // await runWasmImplementation(runCount, warmupCount, module.exports, 50000);
  // await timeout(1000);
  // await runWasmImplementation(runCount, warmupCount, module.exports, 100000);

  console.debug(`end benchmark`);
})();
