import {
  BEChartPoint,
  ChartUpdate,
  ChartUpdate2,
  getUpdateChunk,
  LastValues,
} from "./misc";

export async function runBaseImplementation(
  runCount: number,
  warmupCount: number,
  chunkSize: number
) {
  const testChunks = await getUpdateChunk(chunkSize);
  console.debug(`[JS]: get loops from ${chunkSize} points`);

  // const lastValues: LastValues = {
  //   balance: null,
  //   equity: null,
  // };

  // function getValues(
  //   key: "balance" | "equity",
  //   currentPoint: BEChartPoint,
  //   prevPoint?: BEChartPoint,
  //   nextPoint?: BEChartPoint
  // ) {
  //   const isPrevPointWasLoop = prevPoint ? prevPoint.is_loop : false;
  //   const isNextPointLoop = nextPoint ? nextPoint.is_loop : false;
  //   const currentValue = currentPoint[key] ?? null;
  //   const isLoop = currentPoint.is_loop;
  //   const isNextPointValueEmpty = nextPoint
  //     ? nextPoint[key] === undefined || nextPoint[key] === null
  //     : true;

  //   let value: number | null = null;
  //   let loopValue: number | null = null;
  //   let unalteredGapValue: number | null = null;

  //   if (isLoop) {
  //     loopValue = currentValue;
  //     if (!isPrevPointWasLoop || !isNextPointLoop) {
  //       value = currentValue;
  //     }
  //     if (nextPoint && isNextPointValueEmpty && !isNextPointLoop) {
  //       unalteredGapValue = currentValue;
  //     }
  //   } else {
  //     if (currentValue === undefined || currentValue === null) {
  //       unalteredGapValue = lastValues[key];
  //       if (nextPoint && !isNextPointValueEmpty) {
  //         value = lastValues[key];
  //       }
  //     } else {
  //       value = currentValue;
  //       if (isNextPointValueEmpty && nextPoint && !isNextPointLoop) {
  //         unalteredGapValue = currentValue;
  //       }
  //     }
  //   }

  //   // Set lastValue variable for next iteration
  //   if (currentValue !== undefined && currentValue !== null) {
  //     lastValues[key] = currentValue;
  //   }

  //   return {
  //     value,
  //     loopValue,
  //     unalteredGapValue,
  //   };
  // }

  // function reducePoints(points: BEChartPoint[]): ChartUpdate {
  //   const update = points.reduce<ChartUpdate>(
  //     (
  //       acc: ChartUpdate,
  //       currentPoint: BEChartPoint,
  //       index: number,
  //       array: BEChartPoint[]
  //     ) => {
  //       const prevPoint = index - 1 >= 0 ? array[index - 1] : undefined;
  //       const nextPoint =
  //         index + 1 <= array.length ? array[index + 1] : undefined;
  //       const ts = Math.floor(currentPoint.millis);
  //       const {
  //         value: balance,
  //         loopValue: balanceLoop,
  //         unalteredGapValue: balanceUnalteredGap,
  //       } = getValues("balance", currentPoint, prevPoint, nextPoint);
  //       const {
  //         value: equity,
  //         loopValue: equityLoop,
  //         unalteredGapValue: equityUnalteredGap,
  //       } = getValues("equity", currentPoint, prevPoint, nextPoint);

  //       return {
  //         index: [...acc.index, currentPoint.index],
  //         ts: [...acc.ts, ts],
  //         balance: [...acc.balance, balance],
  //         balanceLoop: [...acc.balanceLoop, balanceLoop],
  //         balanceUnalteredGap: [
  //           ...acc.balanceUnalteredGap,
  //           balanceUnalteredGap,
  //         ],
  //         equity: [...acc.equity, equity],
  //         equityLoop: [...acc.equityLoop, equityLoop],
  //         equityUnalteredGap: [...acc.equityUnalteredGap, equityUnalteredGap],
  //       };
  //     },
  //     {
  //       index: [],
  //       ts: [],
  //       balance: [],
  //       balanceLoop: [],
  //       balanceUnalteredGap: [],
  //       equity: [],
  //       equityLoop: [],
  //       equityUnalteredGap: [],
  //     }
  //   );

  //   // Clear temporary values.
  //   lastValues.balance = null;
  //   lastValues.equity = null;

  //   return update;
  // }

  let lastValue: number = NaN;
  function getValues(
    valueArray: number[],
    loopArray: boolean[]
  ): {
    newValueArray: number[];
    loopValueArray: number[];
    unalteredValueArray: number[];
  } {
    const newValueArray = new Array(valueArray.length);
    const loopValueArray = new Array(valueArray.length);
    const unalteredValueArray = new Array(valueArray.length);

    for (let i = 0; i < valueArray.length; i++) {
      const prevIndex = i - 1 >= 0 ? i - 1 : NaN;
      const currentValue = valueArray[i];
      const nextIndex = i + 1 < valueArray.length ? i + 1 : NaN;
      const nextValue = !isNaN(nextIndex) ? valueArray[nextIndex] : NaN;

      const isCurrentPointLoop = loopArray[i];
      const isPrevPointLoop = !isNaN(prevIndex) ? loopArray[prevIndex] : false;
      const isNextPointLoop = !isNaN(nextIndex) ? loopArray[nextIndex] : false;

      let value: number = NaN;
      let loopValue: number = NaN;
      let unalteredGapValue: number = NaN;

      if (isCurrentPointLoop) {
        loopValue = currentValue;
        if (!isPrevPointLoop || !isNextPointLoop) {
          value = currentValue;
        }
        if (!isNaN(nextValue) && !isNextPointLoop) {
          unalteredGapValue = currentValue;
        }
      } else {
        if (!isNaN(currentValue)) {
          unalteredGapValue = lastValue;
          if (!isNaN(nextValue)) {
            value = lastValue;
          }
        } else {
          value = currentValue;
          if (isNaN(nextValue) && !isNextPointLoop) {
            unalteredGapValue = currentValue;
          }
        }
      }

      if (!isNaN(currentValue)) {
        lastValue = currentValue;
      }

      newValueArray[i] = value;
      loopValueArray[i] = loopValue;
      unalteredValueArray[i] = unalteredGapValue;
    }

    lastValue = NaN;

    return {
      newValueArray,
      loopValueArray,
      unalteredValueArray,
    };
  }

  function findLoops(
    balanceArray: number[],
    equityArray: number[],
    loopArray: boolean[]
  ) {
    const calculatedBalance = getValues(balanceArray, loopArray);
    const calculatedEquity = getValues(equityArray, loopArray);

    return {
      balanceValueArray: calculatedBalance.newValueArray,
      balanceLoopValueArray: calculatedBalance.loopValueArray,
      balanceUnalteredValueArray: calculatedBalance.unalteredValueArray,
      equityValueArray: calculatedEquity.newValueArray,
      equityLoopValueArray: calculatedEquity.loopValueArray,
      equityUnalteredValueArray: calculatedEquity.unalteredValueArray,
    };
  }

  function getLoops(chunks: ChartUpdate2) {
    const foundLoops = findLoops(chunks.balance, chunks.equity, chunks.isLoop);
    return foundLoops;
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
  console.debug({ result });
}
