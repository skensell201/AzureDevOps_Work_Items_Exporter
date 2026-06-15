import { runBatched } from '../batch';

describe('runBatched', () => {
  it('keeps input order and limits concurrency', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const worker = async (n: number) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 1));
      inFlight--;
      return n * 2;
    };
    const result = await runBatched([1, 2, 3, 4, 5], worker, 2);
    expect(result).toEqual([2, 4, 6, 8, 10]);
    expect(maxInFlight).toBeLessThanOrEqual(2);
  });
});
