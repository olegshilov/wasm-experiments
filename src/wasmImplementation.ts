import {
  BEChartPoint,
  ChartUpdate,
  LastValues,
  sourceBEChartPoint,
} from "./misc";

export async function runWasmImplementation(
  runCount: number,
  warmupCount: number,
  wasm: any
) {
  console.debug("run wasm implementation", { wasm });
  const {
    OptionalFloat64Value,
    ReturnValue,
    ChartPoint,
    LastValues,
    getValues,
  } = wasm;

  let lastValues: LastValues = {
    balance: null,
    equity: null,
  };

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

  function reducerCallback(
    accumulator: ChartUpdate,
    currentPoint: BEChartPoint,
    index: number,
    array: BEChartPoint[]
  ): ChartUpdate {
    const prevPoint = index - 1 >= 0 ? array[index - 1] : undefined;
    const nextPoint = index + 1 <= array.length ? array[index + 1] : undefined;
    const ts = Math.floor(currentPoint.millis);

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

    const balanceWasmReturn = getValues(
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
    const equityWasmReturn = getValues(
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

  function reducePoints(points: BEChartPoint[]): ChartUpdate {
    const update = points.reduce(reducerCallback, {
      index: [],
      ts: [],
      balance: [],
      balanceLoop: [],
      balanceUnalteredGap: [],
      equity: [],
      equityLoop: [],
      equityUnalteredGap: [],
    });

    // Clear temporary values.
    lastValues.balance = null;
    lastValues.equity = null;

    return update;
  }

  console.debug(`warm-up: ${warmupCount} times`);
  let w = 0;
  let wResult;
  while (w < warmupCount) {
    wResult = reducePoints(sourceBEChartPoint);
    w++;
  }

  console.debug(`start: ${runCount} times`);
  let i = 0;
  let result;
  const startTime = performance.now();
  while (i < runCount) {
    result = reducePoints(sourceBEChartPoint);
    i++;
  }
  const endTime = performance.now() - startTime;

  console.debug(`total time: ${endTime}ms`);
  // console.debug({ result });
}
