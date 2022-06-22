import { useRef } from 'react';
import { useOnce } from './useOnce';


/**
 * This hook provides stable function that invokes passed callback.
 * It doesn't require dependencies, because callback is always up-to-date.
 * Use it as alternative for `useCallback()`.
 */
export function useFunction<T extends (...args: any[]) => any>(fn: T): T {
  const fnRef = useRef<T>(fn);

  fnRef.current = fn;

  return useOnce<T>(() => {
    return ((...args: Parameters<T>): ReturnType<T> => {
      const { current: originalFunction } = fnRef;

      return originalFunction(...args);
    }) as T;
  });
}
