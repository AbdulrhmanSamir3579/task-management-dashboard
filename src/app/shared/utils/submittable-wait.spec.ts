import { submittableWait } from './submittable-wait';

describe('submittableWait', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /** Calls the wait like `debounced()` does and reports when it is over. */
  function start(wait: ReturnType<typeof submittableWait<string>>['wait'], value: string) {
    const state = { done: false };
    const result = typeof wait === 'number' ? undefined : wait(value, { status: 'idle' } as never);
    if (result === undefined) {
      state.done = true;
    } else {
      void result.then(() => (state.done = true));
    }
    return { state, immediate: result === undefined };
  }

  it('waits for the delay', async () => {
    const { wait } = submittableWait<string>(() => 300);

    const { state } = start(wait, 'budget');
    await vi.advanceTimersByTimeAsync(299);
    expect(state.done).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(state.done).toBe(true);
  });

  it('ends the wait at once when its value is submitted', async () => {
    const search = submittableWait<string>(() => 300);
    const { state } = start(search.wait, 'budget');

    search.submit('budget');
    await vi.advanceTimersByTimeAsync(0);

    expect(state.done).toBe(true);
  });

  it('skips the wait when the value was submitted before the wait started', () => {
    const search = submittableWait<string>(() => 300);

    search.submit('budget');

    expect(start(search.wait, 'budget').immediate).toBe(true);
  });

  it('forgets a submitted value once another value waits', () => {
    const search = submittableWait<string>(() => 300);

    search.submit('budget');
    start(search.wait, 'budg');

    expect(start(search.wait, 'budget').immediate).toBe(false);
  });

  it('does not end the wait for a different value', async () => {
    const search = submittableWait<string>(() => 300);
    const { state } = start(search.wait, 'budget');

    search.submit('docs');
    await vi.advanceTimersByTimeAsync(0);

    expect(state.done).toBe(false);
  });

  it('starts a new wait for a newer value', async () => {
    const { wait } = submittableWait<string>(() => 300);
    start(wait, 'bud');
    await vi.advanceTimersByTimeAsync(200);

    const { state } = start(wait, 'budget');
    await vi.advanceTimersByTimeAsync(200);
    expect(state.done).toBe(false);

    await vi.advanceTimersByTimeAsync(100);
    expect(state.done).toBe(true);
  });

  it('reads the delay for every value, and uses the value at once for 0', () => {
    let delay = 300;
    const { wait } = submittableWait<string>(() => delay);

    expect(start(wait, 'bud').immediate).toBe(false);
    delay = 0;
    expect(start(wait, 'budget').immediate).toBe(true);
  });
});
