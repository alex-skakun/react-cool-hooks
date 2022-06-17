import { renderHook } from '@testing-library/react';
import { useOnce } from './useOnce';

describe('useOnce()', () => {
  it('should return stable result for each render', () => {
    const { result, rerender } = renderHook(() => {
      return useOnce(() => Symbol('test'));
    });

    const firstResult = result.current;
    rerender();
    const secondsResult = result.current;

    expect(firstResult).toBe(secondsResult);
  });
});
