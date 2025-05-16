import { useRef } from 'react';
import { useOnce } from './useOnce';


interface MemoizedFunction<T extends (...args: any[]) => any> extends CallableFunction {
  (...args: Parameters<T>): ReturnType<T>;
}

/**
 * @summary
 * This hook provides a stable function that invokes passed callback.
 * It doesn't require dependencies because callback is always up to date.
 * Use it as an alternative for `useCallback()`.
 */
export function useFunction<T extends (...args: any[]) => any>(fn: T): MemoizedFunction<T> {
  const fnRef = useRef<T>(fn);

  fnRef.current = fn;

  return useOnce<MemoizedFunction<T>>(() => {
    return ((...args: Parameters<T>): ReturnType<T> => {
      const { current: originalFunction } = fnRef;

      return originalFunction(...args);
    });
  });
}
