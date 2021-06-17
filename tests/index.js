const fs = require("fs");
const path = require("path");
const loader = require("@assemblyscript/loader");
const Benchmark = require("benchmark");

const wasmModule = loader.instantiateSync(
  fs.readFileSync(path.resolve(__dirname, "../build/optimized.wasm")),
  {}
);

const { OptionalFloat64Value, ReturnValue, ChartPoint, LastValues, getValues } =
  wasmModule.exports;

function createOptionalValue(possiblyNullableValue) {
  const isEmpty =
    possiblyNullableValue === null || possiblyNullableValue === undefined;
  const value = isEmpty ? 0 : possiblyNullableValue;

  return new OptionalFloat64Value(value, isEmpty);
}
function parseOptionalValue(optionalValue) {
  const { isEmpty, value } = OptionalFloat64Value.wrap(optionalValue);

  if (isEmpty) {
    return null;
  }

  return value;
}

let lastValuesAS = {
  balance: null,
  equity: null,
};
function reducerCallbackAS(accumulator, currentPoint, index, array) {
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
    createOptionalValue(lastValuesAS.balance),
    createOptionalValue(lastValuesAS.equity)
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

  lastValuesAS = {
    balance: parseOptionalValue(lastBalanceValue),
    equity: parseOptionalValue(lastEquityValue),
  };

  accumulator.index.push(currentPoint.index);
  accumulator.ts.push(ts);
  accumulator.balance.push(parseOptionalValue(balance));
  accumulator.balanceLoop.push(parseOptionalValue(balanceLoop));
  accumulator.balanceUnalteredGap.push(parseOptionalValue(balanceUnalteredGap));
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
function reducePointsAS(points) {
  const update = points.reduce(reducerCallbackAS, {
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
  lastValuesAS.balance = null;
  lastValuesAS.equity = null;

  return update;
}

let lastValuesJS = {
  balance: null,
  equity: null,
};
function getValuesJS(key, currentPoint, prevPoint, nextPoint) {
  const isPrevPointWasLoop = prevPoint ? prevPoint.is_loop : false;
  const isNextPointLoop = nextPoint ? nextPoint.is_loop : false;
  const currentValue = currentPoint[key] ?? null;
  const isLoop = currentPoint.is_loop;
  const isNextPointValueEmpty = nextPoint
    ? nextPoint[key] === undefined || nextPoint[key] === null
    : true;

  let value = null;
  let loopValue = null;
  let unalteredGapValue = null;

  if (isLoop) {
    loopValue = currentValue;
    if (!isPrevPointWasLoop || !isNextPointLoop) {
      value = currentValue;
    }
    if (nextPoint && isNextPointValueEmpty && !isNextPointLoop) {
      unalteredGapValue = currentValue;
    }
  } else {
    if (currentValue === undefined || currentValue === null) {
      unalteredGapValue = lastValuesJS[key];
      if (nextPoint && !isNextPointValueEmpty) {
        value = lastValuesJS[key];
      }
    } else {
      value = currentValue;
      if (isNextPointValueEmpty && nextPoint && !isNextPointLoop) {
        unalteredGapValue = currentValue;
      }
    }
  }

  // Set lastValue variable for next iteration
  if (currentValue !== undefined && currentValue !== null) {
    lastValuesJS[key] = currentValue;
  }

  return {
    value,
    loopValue,
    unalteredGapValue,
  };
}
function reducePointsJS(points) {
  const update = points.reduce(
    (acc, currentPoint, index, array) => {
      const prevPoint = index - 1 >= 0 ? array[index - 1] : undefined;
      const nextPoint =
        index + 1 <= array.length ? array[index + 1] : undefined;
      const ts = Math.floor(currentPoint.millis);
      const {
        value: balance,
        loopValue: balanceLoop,
        unalteredGapValue: balanceUnalteredGap,
      } = getValuesJS("balance", currentPoint, prevPoint, nextPoint);
      const {
        value: equity,
        loopValue: equityLoop,
        unalteredGapValue: equityUnalteredGap,
      } = getValuesJS("equity", currentPoint, prevPoint, nextPoint);

      return {
        index: [...acc.index, currentPoint.index],
        ts: [...acc.ts, ts],
        balance: [...acc.balance, balance],
        balanceLoop: [...acc.balanceLoop, balanceLoop],
        balanceUnalteredGap: [...acc.balanceUnalteredGap, balanceUnalteredGap],
        equity: [...acc.equity, equity],
        equityLoop: [...acc.equityLoop, equityLoop],
        equityUnalteredGap: [...acc.equityUnalteredGap, equityUnalteredGap],
      };
    },
    {
      index: [],
      ts: [],
      balance: [],
      balanceLoop: [],
      balanceUnalteredGap: [],
      equity: [],
      equityLoop: [],
      equityUnalteredGap: [],
    }
  );

  // Clear temporary values.
  lastValuesJS.balance = null;
  lastValuesJS.equity = null;

  return update;
}

const suite = new Benchmark.Suite();
const sourceBEChartPoint = [
  { index: 0, millis: 0.1, balance: 100, equity: 100, is_loop: false },
  { index: 1, millis: 0.2, balance: 100, equity: 101, is_loop: false },
  { index: 2, millis: 0.3, balance: 101, equity: 102, is_loop: true },
  { index: 3, millis: 0.3, balance: 102, equity: 102, is_loop: true },
  { index: 4, millis: 0.3, balance: 103, equity: 102, is_loop: true },
  { index: 5, millis: 0.4, balance: 102, equity: 104, is_loop: false },
  { index: 6, millis: 0.5, balance: 100, equity: 104, is_loop: false },
  { index: 7, millis: 0.6, balance: null, equity: 105, is_loop: false },
  { index: 8, millis: 0.7, balance: null, equity: 105, is_loop: false },
  { index: 9, millis: 0.8, balance: null, equity: 105, is_loop: false },
  { index: 10, millis: 0.9, balance: 103, equity: 106, is_loop: false },
  { index: 11, millis: 0.1, balance: 102, equity: 106, is_loop: false },
  { index: 12, millis: 0.11, balance: 101, equity: 103, is_loop: true },
  { index: 13, millis: 0.11, balance: 100, equity: 105, is_loop: true },
  { index: 14, millis: 0.11, balance: 102, equity: 103, is_loop: true },
  { index: 15, millis: 0.12, balance: null, equity: 104, is_loop: false },
  { index: 16, millis: 0.13, balance: null, equity: 103, is_loop: false },
  { index: 17, millis: 0.14, balance: null, equity: 105, is_loop: false },
];

suite
  .add("JS", function () {
    reducePointsJS(sourceBEChartPoint);
  })
  .add("AS", function () {
    reducePointsAS(sourceBEChartPoint);
  })
  .on("cycle", function (event) {
    console.log(String(event.target));
  })
  .on("complete", function () {
    console.log("Fastest is " + this.filter("fastest").map("name"));
  })
  .run({ async: true });
