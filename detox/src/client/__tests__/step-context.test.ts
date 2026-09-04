import { describe, it, expect } from 'vitest';

import { StepContext } from '../step-context';

describe('StepContext (spec 013)', () => {
  it('is empty outside run, carries the id across awaits inside it, and keeps concurrent bodies apart', async () => {
    const steps = new StepContext();
    expect(steps.current()).toBeUndefined();
    const a = steps.run('a', async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return steps.current();
    });
    const b = steps.run('b', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return steps.current();
    });
    expect(steps.current()).toBeUndefined();
    await expect(Promise.all([a, b])).resolves.toEqual(['a', 'b']);
    expect(steps.run('sync', () => steps.current())).toBe('sync');
    expect(steps.run('outer', () => steps.run('inner', () => steps.current()))).toBe('inner');
  });
});
