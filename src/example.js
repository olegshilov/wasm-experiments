import loader from "@assemblyscript/loader";
import wasmPath from "url:../build/untouched.wasm";

(async () => {
  const importObject = {
    // env: {
    //   abort(_msg, _file, line, column) {
    //     console.error("abort called at index.ts:" + line + ":" + column);
    //   },
    //   trace(msg, n) {
    //     console.log(
    //       "trace: " +
    //         wasm.__getString(msg) +
    //         (n ? " " : "") +
    //         Array.prototype.slice.call(arguments, 2, 2 + n).join(", ")
    //     );
    //   },
    // },
  };
  const module = await loader.instantiateStreaming(
    fetch(wasmPath),
    importObject
  );

  console.debug({ module });
  const exports = module.instance.exports;
  console.debug({ exports });

  const testPoint = {
    index: BigInt(0),
    millis: BigInt(1),
    balance: 100,
    equity: 100,
    is_loop: false,
  };
  const { createPoint, getValues } = exports;

  const point = createPoint(
    testPoint.index,
    testPoint.millis,
    testPoint.balance,
    testPoint.equity,
    testPoint.is_loop
  );
  console.log({ point });
  const balance = getValues(point);
  console.log({ balance });
})();
