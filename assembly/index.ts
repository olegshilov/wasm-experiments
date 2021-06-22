export const Float64Array_ID = idof<Float64Array>();
export const BoolArray_ID = idof<Array<bool>>();

export class ReturnValue {
  public balance: Float64Array;
  public balanceLoop: Float64Array;
  public balanceUnalteredGap: Float64Array;
  public equity: Float64Array;
  public equityLoop: Float64Array;
  public equityUnalteredGap: Float64Array;

  constructor(
    balance: Float64Array,
    balanceLoop: Float64Array,
    balanceUnalteredGap: Float64Array,
    equity: Float64Array,
    equityLoop: Float64Array,
    equityUnalteredGap: Float64Array
  ) {
    this.balance = balance;
    this.balanceLoop = balanceLoop;
    this.balanceUnalteredGap = balanceUnalteredGap;
    this.equity = equity;
    this.equityLoop = equityLoop;
    this.equityUnalteredGap = equityUnalteredGap;
  }
}

class CalculatedValues {
  public newValueArray: Float64Array;
  public loopValueArray: Float64Array;
  public unalteredValueArray: Float64Array;

  constructor(
    newValueArray: Float64Array,
    loopValueArray: Float64Array,
    unalteredValueArray: Float64Array
  ) {
    this.newValueArray = newValueArray;
    this.loopValueArray = loopValueArray;
    this.unalteredValueArray = unalteredValueArray;
  }
}

let lastValue: f64 = NaN;

function getValues(
  valueArray: Float64Array,
  loopArray: Array<bool>
): CalculatedValues {
  const newValueArray = new Float64Array(valueArray.length);
  const loopValueArray = new Float64Array(valueArray.length);
  const unalteredValueArray = new Float64Array(valueArray.length);

  for (let i = 0; i < valueArray.length; i++) {
    const prevIndex = i - 1 >= 0 ? i - 1 : NaN;
    const currentValue = valueArray[i];
    const nextIndex = i + 1 < valueArray.length ? i + 1 : NaN;
    // const prevValue = !isNaN(prevIndex) ? array[<i32>prevIndex] : NaN;
    const nextValue = !isNaN(nextIndex) ? valueArray[<i32>nextIndex] : NaN;

    const isCurrentPointLoop = loopArray[i];
    const isPrevPointLoop = !isNaN(prevIndex)
      ? loopArray[<i32>prevIndex]
      : false;
    const isNextPointLoop = !isNaN(nextIndex)
      ? loopArray[<i32>nextIndex]
      : false;

    let value: f64 = NaN;
    let loopValue: f64 = NaN;
    let unalteredGapValue: f64 = NaN;

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

  return new CalculatedValues(
    newValueArray,
    loopValueArray,
    unalteredValueArray
  );
}

export function findLoops(
  balanceArray: Float64Array,
  equityArray: Float64Array,
  loopArray: Array<bool>
): ReturnValue {
  const calculatedBalance = getValues(balanceArray, loopArray);
  const calculatedEquity = getValues(equityArray, loopArray);

  return new ReturnValue(
    calculatedBalance.newValueArray,
    calculatedBalance.loopValueArray,
    calculatedBalance.unalteredValueArray,
    calculatedEquity.newValueArray,
    calculatedEquity.loopValueArray,
    calculatedEquity.unalteredValueArray
  );
}
