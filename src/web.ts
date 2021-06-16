import loader from "@assemblyscript/loader";
import wasmPath from "url:../build/untouched.wasm";

console.clear();

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

const expectedReducedPoints: ChartUpdate = {
  index: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  ts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  balance: [
    100,
    100,
    101,
    null,
    103,
    102,
    100,
    null,
    null,
    100,
    103,
    102,
    101,
    null,
    102,
    null,
    null,
    null,
  ],
  balanceLoop: [
    null,
    null,
    101,
    102,
    103,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    101,
    100,
    102,
    null,
    null,
    null,
  ],
  balanceUnalteredGap: [
    null,
    null,
    null,
    null,
    null,
    null,
    100,
    100,
    100,
    100,
    null,
    null,
    null,
    null,
    102,
    102,
    102,
    102,
  ],
  equity: [
    100,
    101,
    102,
    null,
    102,
    104,
    104,
    105,
    105,
    105,
    106,
    106,
    103,
    null,
    103,
    104,
    103,
    105,
  ],
  equityLoop: [
    null,
    null,
    102,
    102,
    102,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    103,
    105,
    103,
    null,
    null,
    null,
  ],
  equityUnalteredGap: [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
};

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
  const {
    OptionalFloat64Value,
    ReturnValue,
    ChartPoint,
    LastValues,
    getValues,
  } = exports;

  function createOptionalValue(
    possiblyNullableValue: number | null | undefined
  ) {
    const isEmpty =
      possiblyNullableValue === null || possiblyNullableValue === undefined;
    const value = isEmpty ? 0 : possiblyNullableValue;

    return new OptionalFloat64Value(value, isEmpty);
  }
  function parseOptionalValue(optionalValue: any): number | null {
    const { isEmpty, value } = OptionalFloat64Value.wrap(optionalValue);

    if (isEmpty) {
      return null;
    }

    return value;
  }

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
      createOptionalValue(currentPoint.balance),
      createOptionalValue(currentPoint.equity),
      currentPoint.is_loop
    );
    const prevPointWasm =
      prevPoint !== undefined
        ? new ChartPoint(
            prevPoint.index,
            prevPoint.millis,
            createOptionalValue(prevPoint.balance),
            createOptionalValue(prevPoint.equity),
            prevPoint.is_loop
          )
        : null;
    const nextPointWasm =
      nextPoint !== undefined
        ? new ChartPoint(
            nextPoint.index,
            nextPoint.millis,
            createOptionalValue(nextPoint.balance),
            createOptionalValue(nextPoint.equity),
            nextPoint.is_loop
          )
        : null;
    const lastValuesWasm = new LastValues(
      createOptionalValue(lastValues.balance),
      createOptionalValue(lastValues.equity)
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
      balance: parseOptionalValue(lastBalanceValue),
      equity: parseOptionalValue(lastEquityValue),
    };
    console.debug({ lastValues });

    accumulator.index.push(currentPoint.index);
    accumulator.ts.push(ts);
    accumulator.balance.push(parseOptionalValue(balance));
    accumulator.balanceLoop.push(parseOptionalValue(balanceLoop));
    accumulator.balanceUnalteredGap.push(
      parseOptionalValue(balanceUnalteredGap)
    );
    accumulator.equity.push(parseOptionalValue(equity));
    accumulator.equityLoop.push(parseOptionalValue(equityLoop));
    accumulator.equityUnalteredGap.push(parseOptionalValue(equityUnalteredGap));

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
  console.debug({ expected: expectedReducedPoints });
})();
