export interface BEChartPoint {
  balance?: number | null;
  equity?: number | null;
  index: number;
  is_loop: boolean;
  millis: number;
}

export type ChartUpdate = {
  index: number[];
  ts: number[];
  balance: (number | null)[];
  balanceLoop: (number | null)[];
  balanceUnalteredGap: (number | null)[];
  equity: (number | null)[];
  equityLoop: (number | null)[];
  equityUnalteredGap: (number | null)[];
};
export type ChartUpdate2 = {
  index: number[];
  ts: number[];
  balance: number[];
  equity: number[];
  isLoop: boolean[];
};

export type LastValues = {
  balance: number | null;
  equity: number | null;
};

export const sourceBEChartPoint: BEChartPoint[] = [
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

export const reducedPoints = sourceBEChartPoint.reduce(
  (accumulator: ChartUpdate2, currentPoint: BEChartPoint) => {
    accumulator.index.push(currentPoint.index);
    accumulator.ts.push(Math.floor(currentPoint.millis));
    accumulator.balance.push(currentPoint.balance ?? NaN);
    accumulator.equity.push(currentPoint.equity ?? NaN);
    accumulator.isLoop.push(currentPoint.is_loop);

    return {
      index: accumulator.index,
      ts: accumulator.ts,
      balance: accumulator.balance,
      equity: accumulator.equity,
      isLoop: accumulator.isLoop,
    };
  },
  {
    index: [],
    ts: [],
    balance: [],
    equity: [],
    isLoop: [],
  }
);

export const expectedReducedPoints: ChartUpdate = {
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

export async function getChunk(chunkSize: number): Promise<BEChartPoint[]> {
  const chunks: BEChartPoint[] = new Array(chunkSize);

  for (let i = 0; i < chunks.length; i++) {
    chunks[i] = sourceBEChartPoint[i % sourceBEChartPoint.length];
  }

  return Promise.resolve(chunks);
}

export async function getUpdateChunk(chunkSize: number): Promise<ChartUpdate2> {
  const balance: number[] = new Array(chunkSize);
  const equity: number[] = new Array(chunkSize);
  const index: number[] = new Array(chunkSize);
  const ts: number[] = new Array(chunkSize);
  const isLoop: boolean[] = new Array(chunkSize);

  for (let i = 0; i < chunkSize; i++) {
    index[i] = reducedPoints.index[i % reducedPoints.index.length];
    ts[i] = reducedPoints.ts[i % reducedPoints.index.length];
    isLoop[i] = reducedPoints.isLoop[i % reducedPoints.index.length];
    balance[i] = reducedPoints.balance[i % reducedPoints.balance.length];
    equity[i] = reducedPoints.equity[i % reducedPoints.equity.length];
  }

  return Promise.resolve({
    index,
    ts,
    isLoop,
    balance,
    equity,
  });
}
