export class OptionalFloat64Value {
  public value: f64;
  public isEmpty: bool;

  constructor(value: f64, isEmpty: bool) {
    this.value = value;
    this.isEmpty = isEmpty;
  }
}

export class ChartPoint {
  index: f64;
  millis: f64;
  balance: OptionalFloat64Value;
  equity: OptionalFloat64Value;
  isLoop: bool;

  constructor(
    index: f64,
    millis: f64,
    balance: OptionalFloat64Value,
    equity: OptionalFloat64Value,
    isLoop: bool
  ) {
    this.index = index;
    this.millis = millis;
    this.balance = balance;
    this.equity = equity;
    this.isLoop = isLoop;
  }
}

export class LastValues {
  public balance: OptionalFloat64Value;
  public equity: OptionalFloat64Value;

  constructor(balance: OptionalFloat64Value, equity: OptionalFloat64Value) {
    this.balance = balance;
    this.equity = equity;
  }
}

export class ReturnValue {
  value: OptionalFloat64Value;
  loopValue: OptionalFloat64Value;
  unalteredGapValue: OptionalFloat64Value;
  lastValue: OptionalFloat64Value;

  constructor(
    value: OptionalFloat64Value,
    loopValue: OptionalFloat64Value,
    unalteredGapValue: OptionalFloat64Value,
    lastValue: OptionalFloat64Value
  ) {
    this.value = value;
    this.loopValue = loopValue;
    this.unalteredGapValue = unalteredGapValue;
    this.lastValue = lastValue;
  }
}

export function getValues(
  isBalance: bool,
  currentPoint: ChartPoint,
  prevPoint: ChartPoint | null,
  nextPoint: ChartPoint | null,
  lastValues: LastValues
): ReturnValue {
  trace(isBalance ? "## get balance" : "## get equity", 0);
  if (isBalance) {
    if (lastValues.balance.isEmpty) {
      trace("last balance: null", 0);
    } else {
      trace("last balance:", 1, lastValues.balance.value);
    }
  } else {
    if (lastValues.equity.isEmpty) {
      trace("last equity: null", 0);
    } else {
      trace("last equity:", 1, lastValues.equity.value);
    }
  }

  const isPrevPointLoop = prevPoint ? prevPoint.isLoop : false;
  const isNextPointLoop = nextPoint ? nextPoint.isLoop : false;
  const currentValue = isBalance ? currentPoint.balance : currentPoint.equity;
  const isLoop = currentPoint.isLoop;
  let isNextPointValueEmpty = <bool>true;
  if (nextPoint) {
    if (isBalance) {
      isNextPointValueEmpty = nextPoint.balance.isEmpty;
    } else {
      isNextPointValueEmpty = nextPoint.equity.isEmpty;
    }
  }

  let value = new OptionalFloat64Value(0, true);
  let loopValue = new OptionalFloat64Value(0, true);
  let unalteredGapValue = new OptionalFloat64Value(0, true);

  if (isLoop) {
    const isFirstLoopPoint = !isPrevPointLoop;

    loopValue = currentValue;
    if (isFirstLoopPoint || !isNextPointLoop) {
      value = currentValue;
    }
    if (nextPoint && isNextPointValueEmpty && !isNextPointLoop) {
      unalteredGapValue = currentValue;
    }
  } else {
    if (!currentValue.isEmpty) {
      unalteredGapValue = isBalance ? lastValues.balance : lastValues.equity;
      if (nextPoint && !isNextPointValueEmpty) {
        value = isBalance ? lastValues.balance : lastValues.equity;
      }
    } else {
      value = currentValue;
      if (isNextPointValueEmpty && nextPoint && !isNextPointLoop) {
        unalteredGapValue = currentValue;
      }
    }
  }

  return new ReturnValue(value, loopValue, unalteredGapValue, currentValue);
}
