class ChartPoint {
  index: i64;
  millis: i64;
  balance: f64;
  equity: f64;
  isLoop: boolean;
  // isBalanceEmpty: boolean;
  // isEquityEmpty: boolean;

  constructor(
    index: i64,
    millis: i64,
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

class LastValues {
  balance: i64;
  equity: i64;
}

export class ReturnValue {
  index: i64;
  balance: i64;
  millis: i64;
  // loopValue: i64;
  // unalteredGapValue: i64;
  // lastValue: i64;

  constructor(
    index: i64,
    balance: i64,
    millis: i64
    // loopValue: i64,
    // unalteredGapValue: i64,
    // lastValue: i64
  ) {
    this.index = index;
    this.balance = balance;
    this.millis = millis;
    // this.loopValue = loopValue;
    // this.unalteredGapValue = unalteredGapValue;
    // this.lastValue = lastValue;
  }
}

export function createPoint(
  index: i64,
  millis: i64,
  balance: f64,
  equity: f64,
  isLoop: boolean
): ChartPoint {
  // trace("hello", 3, index, millis, balance);
  return new ChartPoint(index, millis, balance, equity, isLoop);
}

export function getValues(currentPoint: ChartPoint): i64 {
  return <i64>currentPoint.balance;
}

export function getBalance(currentPoint: ChartPoint): ReturnValue {
  const index = <i64>currentPoint.index;
  const balance = <i64>currentPoint.balance;
  const millis = <i64>currentPoint.millis;

  return new ReturnValue(index, balance, millis);
}
