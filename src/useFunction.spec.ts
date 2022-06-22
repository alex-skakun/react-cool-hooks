import { renderHook } from '@testing-library/react';
import { useFunction } from './useFunction';


describe('useFunction()', () => {

  it('should return the same function for each rerender', () => {
    const { result, rerender } = renderHook(() => useFunction(() => 0));

    const firstResult = result.current;
    rerender();
    const secondResult = result.current;

    expect(firstResult).toBe(secondResult);
  });

  it('should always use actual props', () => {
    const { result, rerender } = renderHook(({ run }) => {
      const testFn = useFunction(() => {
        return run;
      });

      return testFn();
    }, { initialProps: { run: 1 } });

    expect(result.current).toBe(1);
    rerender({ run: 2 });
    expect(result.current).toBe(2);
  });

});
