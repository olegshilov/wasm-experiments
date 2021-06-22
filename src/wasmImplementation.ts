import { getUpdateChunk } from "./misc";

export async function runWasmImplementation(
  runCount: number,
  warmupCount: number,
  wasm: any,
  chunkSize: number,
  type: string
) {
  const testChunks = await getUpdateChunk(chunkSize);
  console.debug(`[AS] ${type}: reduce ${chunkSize} chunks`);

  const { __getFloat64Array, __newArray, __pin, __unpin } = wasm;
  const { Float64Array_ID, BoolArray_ID, findLoops, ReturnValue } = wasm;

  function parseResult(result: typeof ReturnValue) {
    const parsed = ReturnValue.wrap(result);
    return {
      balance: __getFloat64Array(parsed.balance),
      balanceLoop: __getFloat64Array(parsed.balanceLoop),
      balanceUnalteredGap: __getFloat64Array(parsed.balanceUnalteredGap),
      equity: __getFloat64Array(parsed.equity),
      equityLoop: __getFloat64Array(parsed.equityLoop),
      equityUnalteredGap: __getFloat64Array(parsed.equityUnalteredGap),
    };
  }

  function getLoops(chunks: any) {
    const balanceF64Array = __pin(__newArray(Float64Array_ID, chunks.balance));
    const equityF64Array = __pin(__newArray(Float64Array_ID, chunks.equity));
    const loopBoolArray = __pin(__newArray(BoolArray_ID, chunks.isLoop));

    const foundLoops = findLoops(
      balanceF64Array,
      equityF64Array,
      loopBoolArray
    );

    const result = parseResult(foundLoops);

    __unpin(balanceF64Array);
    __unpin(equityF64Array);
    __unpin(loopBoolArray);

    return result;
  }

  console.debug(`warm-up: ${warmupCount} times`);
  let w = 0;
  let wResult;
  while (w < warmupCount) {
    wResult = getLoops(testChunks);
    w++;
  }
  console.debug(`start: ${runCount} times`);
  let i = 0;
  let result;
  const startTime = performance.now();
  while (i < runCount) {
    result = getLoops(testChunks);
    i++;
  }
  const endTime = performance.now() - startTime;
  console.debug(`total time: ${endTime}ms`);
  // console.debug({ result });
}
