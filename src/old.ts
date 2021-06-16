const lastValues: {
  balance: number | null;
  equity: number | null;
} = {
  balance: null,
  equity: null,
};

function getValues(
  key: "balance" | "equity",
  currentPoint: BEChartPoint,
  prevPoint?: BEChartPoint,
  nextPoint?: BEChartPoint
) {
  const isPrevPointWasLoop = prevPoint ? prevPoint.is_loop : false;
  const isNextPointLoop = nextPoint ? nextPoint.is_loop : false;
  const currentValue = currentPoint[key] ?? null;
  const isLoop = currentPoint.is_loop;
  const isNextPointValueEmpty = nextPoint
    ? nextPoint[key] === undefined || nextPoint[key] === null
    : true;

  let value: number | null = null;
  let loopValue: number | null = null;
  let unalteredGapValue: number | null = null;

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
      unalteredGapValue = lastValues[key];
      if (nextPoint && !isNextPointValueEmpty) {
        value = lastValues[key];
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
    lastValues[key] = currentValue;
  }

  return {
    value,
    loopValue,
    unalteredGapValue,
  };
}
