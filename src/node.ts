import fs from "fs";
import assert from "assert";
import loader from "@assemblyscript/loader";
const imports = {
  /* imports go here */
};
const wasmModule = loader.instantiateSync(
  fs.readFileSync(__dirname + "/build/untouched.wasm"),
  imports
);

const myModule = wasmModule.exports;
console.debug({ myModule });

const createChartPoint = myModule.ChartPoint;

const point = createChartPoint();
console.log({ point });

assert.strictEqual(myModule.add(1, 2), 3);

console.log("ok");