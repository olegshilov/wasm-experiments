export class OptionalFloat64Value {
  public value: f64;
  public isEmpty: bool;

  constructor(value: f64, isEmpty: bool) {
    this.value = value;
    this.isEmpty = isEmpty;
  }
}

export class ChartPoint {
  public index: f64;
  public millis: f64;
  public balance: f64;
  public equity: f64;
  public isLoop: bool;

  constructor(
    index: f64,
    millis: f64,
    balance: f64,
    equity: f64,
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
  public balance: f64;
  public equity: f64;

  constructor(balance: f64, equity: f64) {
    this.balance = balance;
    this.equity = equity;
  }
}

export class ReturnValue {
  public value: f64;
  public loopValue: f64;
  public unalteredGapValue: f64;
  public lastValue: f64;

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

export function getValues(
  isBalance: bool,
  currentPoint: ChartPoint,
  prevPoint: ChartPoint | null,
  nextPoint: ChartPoint | null,
  lastValues: LastValues
): ReturnValue {
  const isPrevPointLoop = prevPoint ? prevPoint.isLoop : false;
  const isNextPointLoop = nextPoint ? nextPoint.isLoop : false;
  const currentValue = isBalance ? currentPoint.balance : currentPoint.equity;
  const lastValue = isBalance ? lastValues.balance : lastValues.equity;

  let value = new OptionalFloat64Value(0, true);
  let loopValue = new OptionalFloat64Value(0, true);
  let unalteredGapValue = new OptionalFloat64Value(0, true);
  let isNextPointValueEmpty = <bool>true;
  if (nextPoint) {
    isNextPointValueEmpty = isBalance
      ? nextPoint.balance.isEmpty
      : nextPoint.equity.isEmpty;
  }

  if (currentPoint.isLoop) {
    loopValue = currentValue;
    if (!isPrevPointLoop || !isNextPointLoop) {
      value = currentValue;
    }
    if (nextPoint && isNextPointValueEmpty && !isNextPointLoop) {
      unalteredGapValue = currentValue;
    }
  } else {
    if (currentValue.isEmpty) {
      unalteredGapValue = lastValue;
      if (nextPoint && !isNextPointValueEmpty) {
        value = lastValue;
      }
    } else {
      value = currentValue;
      if (isNextPointValueEmpty && nextPoint && !isNextPointLoop) {
        unalteredGapValue = currentValue;
      }
    }
  }

  return new ReturnValue(
    value,
    loopValue,
    unalteredGapValue,
    currentValue.isEmpty ? lastValue : currentValue
  );
}
