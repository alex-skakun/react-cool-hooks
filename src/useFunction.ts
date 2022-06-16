import { useRef } from 'react';
import { useOnce } from './useOnce';


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