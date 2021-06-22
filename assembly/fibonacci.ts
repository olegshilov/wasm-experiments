export function fibonacci(n: i32): i32 {
  let i: i32 = 1;
  let j: i32 = 0;
  let k: i32;
  let t: i32;

  for (k = 1; k <= Math.abs(n); k++) {
    t = i + j;
    i = j;
    j = t;
  }
  if (n < 0 && n % 2 === 0) {
    j = -j;
  }
  return j;
}
