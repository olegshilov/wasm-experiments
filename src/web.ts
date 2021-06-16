import loader from "@assemblyscript/loader";
import wasmPath from "url:../build/untouched.wasm";

interface BEChartPoint {
  balance?: number | null;
  equity?: number | null;
  index: number;
  is_loop: boolean;
  millis: number;
}

type ChartUpdate = {
  index: number[];
  ts: number[];
  balance: (number | null)[];
  balanceLoop: (number | null)[];
  balanceUnalteredGap: (number | null)[];
  equity: (number | null)[];
  equityLoop: (number | null)[];
  equityUnalteredGap: (number | null)[];
};

type LastValues = {
  balance: number | null;
  equity: number | null;
};

const sourceBEChartPoint: BEChartPoint[] = [
  { index: 0, millis: 1, balance: 100, equity: 100, is_loop: false },
  { index: 1, millis: 2, balance: 100, equity: 101, is_loop: false },
  { index: 2, millis: 3, balance: 101, equity: 102, is_loop: true },
  { index: 3, millis: 3, balance: 102, equity: 102, is_loop: true },
  { index: 4, millis: 3, balance: 103, equity: 102, is_loop: true },
  { index: 5, millis: 4, balance: 102, equity: 104, is_loop: false },
  { index: 6, millis: 5, balance: 100, equity: 104, is_loop: false },
  { index: 7, millis: 6, balance: null, equity: 105, is_loop: false },
  { index: 8, millis: 7, balance: null, equity: 105, is_loop: false },
  { index: 9, millis: 8, balance: null, equity: 105, is_loop: false },
  { index: 10, millis: 9, balance: 103, equity: 106, is_loop: false },
  { index: 11, millis: 10, balance: 102, equity: 106, is_loop: false },
  { index: 12, millis: 11, balance: 101, equity: 103, is_loop: true },
  { index: 13, millis: 11, balance: 100, equity: 105, is_loop: true },
  { index: 14, millis: 11, balance: 102, equity: 103, is_loop: true },
  { index: 15, millis: 12, balance: null, equity: 104, is_loop: false },
  { index: 16, millis: 13, balance: null, equity: 103, is_loop: false },
  { index: 17, millis: 14, balance: null, equity: 105, is_loop: false },
];

let lastValues: LastValues = {
  balance: null,
  equity: null,
};

(async () => {
  const importObject = {};
  const { exports } = await loader.instantiateStreaming(
    fetch(wasmPath),
    importObject
  );
  const { ReturnValue, ChartPoint, LastValues, getValues } = exports;

  async function reducerCallback(
    accumulatorPromise: Promise<ChartUpdate>,
    currentPoint: BEChartPoint,
    index: number,
    array: BEChartPoint[]
  ): Promise<ChartUpdate> {
    const accumulator = await accumulatorPromise;
    const prevPoint = index - 1 >= 0 ? array[index - 1] : undefined;
    const nextPoint = index + 1 <= array.length ? array[index + 1] : undefined;
    const ts = currentPoint.millis;

    const currentPointWasm = new ChartPoint(
      currentPoint.index,
      currentPoint.millis,
      currentPoint.balance,
      currentPoint.equity,
      currentPoint.is_loop
    );
    const prevPointWasm =
      prevPoint !== undefined
        ? new ChartPoint(
            prevPoint.index,
            prevPoint.millis,
            prevPoint.balance,
            prevPoint.equity,
            prevPoint.is_loop
          )
        : null;
    const nextPointWasm =
      nextPoint !== undefined
        ? new ChartPoint(
            nextPoint.index,
            nextPoint.millis,
            nextPoint.balance,
            nextPoint.equity,
            nextPoint.is_loop
          )
        : null;
    console.debug({
      balance: lastValues.balance,
      equity: lastValues.equity,
    });
    const lastValuesWasm = new LastValues(
      lastValues.balance,
      lastValues.equity
    );

    const balanceWasmReturn = await getValues(
      true,
      currentPointWasm,
      prevPointWasm,
      nextPointWasm,
      lastValuesWasm
    );
    const {
      value: balance,
      loopValue: balanceLoop,
      unalteredGapValue: balanceUnalteredGap,
      lastValue: lastBalanceValue,
    } = ReturnValue.wrap(balanceWasmReturn);
    const equityWasmReturn = await getValues(
      false,
      currentPointWasm,
      prevPointWasm,
      nextPointWasm,
      lastValuesWasm
    );
    const {
      value: equity,
      loopValue: equityLoop,
      unalteredGapValue: equityUnalteredGap,
      lastValue: lastEquityValue,
    } = ReturnValue.wrap(equityWasmReturn);

    lastValues = {
      balance: lastBalanceValue,
      equity: lastEquityValue,
    };

    accumulator.index.push(currentPoint.index);
    accumulator.ts.push(ts);
    accumulator.balance.push(balance);
    accumulator.balanceLoop.push(balanceLoop);
    accumulator.balanceUnalteredGap.push(balanceUnalteredGap);
    accumulator.equity.push(equity);
    accumulator.equityLoop.push(equityLoop);
    accumulator.equityUnalteredGap.push(equityUnalteredGap);

    return {
      index: accumulator.index,
      ts: accumulator.ts,
      balance: accumulator.balance,
      balanceLoop: accumulator.balanceLoop,
      balanceUnalteredGap: accumulator.balanceUnalteredGap,
      equity: accumulator.equity,
      equityLoop: accumulator.equityLoop,
      equityUnalteredGap: accumulator.equityUnalteredGap,
    };
  }

  async function reducePoints(points: BEChartPoint[]): Promise<ChartUpdate> {
    const update = await points.reduce(
      reducerCallback,
      Promise.resolve({
        index: [],
        ts: [],
        balance: [],
        balanceLoop: [],
        balanceUnalteredGap: [],
        equity: [],
        equityLoop: [],
        equityUnalteredGap: [],
      })
    );

    // Clear temporary values.
    lastValues.balance = null;
    lastValues.equity = null;

    return update;
  }

  const result = await reducePoints(sourceBEChartPoint);

  console.debug({ result });
})();
