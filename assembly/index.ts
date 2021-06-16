export class ChartPoint {
  index: f64;
  millis: f64;
  balance: f64;
  equity: f64;
  isLoop: boolean;

  constructor(
    index: f64,
    millis: f64,
    balance: f64,
    equity: f64,
    isLoop: boolean
  ) {
    this.index = index;
    this.millis = millis;
    this.balance = balance;
    this.equity = equity;
    this.isLoop = isLoop;
  }
}

export class LastValues {
  balance: f64;
  equity: f64;

  constructor(balance: f64, equity: f64) {
    this.balance = balance;
    this.equity = equity;
  }
}

export class ReturnValue {
  value: f64;
  loopValue: f64;
  unalteredGapValue: f64;
  lastValue: f64;

  constructor(
    value: f64,
    loopValue: f64,
    unalteredGapValue: f64,
    lastValue: f64
  ) {
    this.value = value;
    this.loopValue = loopValue;
    this.unalteredGapValue = unalteredGapValue;
    this.lastValue = lastValue;
  }
}

// export function getValues(currentPoint: ChartPoint): ReturnValue {
//   const index = currentPoint.index;
//   const millis = currentPoint.millis;
//   const balance = currentPoint.balance;
//   trace("getValues", 3, index, millis, balance);

//   return new ReturnValue(index, millis, balance);
// }

export function getValues(
  isBalance: boolean,
  currentPoint: ChartPoint,
  prevPoint: ChartPoint | null,
  nextPoint: ChartPoint | null,
  lastValues: LastValues
): ReturnValue {
  trace(isBalance ? "get balance" : "get equity", 0);
  trace(
    "currentPoint",
    4,
    currentPoint.index,
    currentPoint.millis,
    currentPoint.balance,
    currentPoint.equity
  );
  if (prevPoint) {
    trace(
      "prevPoint",
      4,
      prevPoint.index,
      prevPoint.millis,
      prevPoint.balance,
      prevPoint.equity
    );
  } else {
  }
  if (nextPoint) {
    trace(
      "nextPoint",
      4,
      nextPoint.index,
      nextPoint.millis,
      nextPoint.balance,
      nextPoint.equity
    );
  }
  trace("lastValues", 2, lastValues.balance, lastValues.equity);

  const hasPrevPoint = !isNullable(prevPoint);
  const hasNextPoint = !isNullable(nextPoint);
  const isPrevPointLoop = hasPrevPoint ? (<ChartPoint>nextPoint).isLoop : false;
  const isNextPointLoop = hasNextPoint ? (<ChartPoint>nextPoint).isLoop : false;
  const currentValue = isBalance ? currentPoint.balance : currentPoint.equity;
  const isLoop = currentPoint.isLoop;
  let isNextPointValueEmpty = true;
  if (hasNextPoint) {
    if (isBalance) {
      isNextPointValueEmpty = !isNullable((<ChartPoint>nextPoint).balance);
    } else {
      isNextPointValueEmpty = !isNullable((<ChartPoint>nextPoint).equity);
    }
  }

  let value: f64;
  let loopValue: f64;
  let unalteredGapValue: f64;

  if (isLoop) {
    const isFirstLoopPoint = !isPrevPointLoop;

    loopValue = currentValue;
    if (isFirstLoopPoint || !isNextPointLoop) {
      value = currentValue;
    }
    if (hasNextPoint && isNextPointValueEmpty && !isNextPointLoop) {
      unalteredGapValue = currentValue;
    }
  } else {
    if (isNullable(currentValue)) {
      unalteredGapValue = isBalance ? lastValues.balance : lastValues.equity;
      if (hasNextPoint && !isNextPointValueEmpty) {
        value = isBalance ? lastValues.balance : lastValues.equity;
      }
    } else {
      value = currentValue;
      if (isNextPointValueEmpty && hasNextPoint && !isNextPointLoop) {
        unalteredGapValue = currentValue;
      }
    }
  }

  return new ReturnValue(value, loopValue, unalteredGapValue, currentValue);
}
