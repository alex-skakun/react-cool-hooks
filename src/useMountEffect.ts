import { useEffect } from 'react';
import { useFunction } from './useFunction';

/**
 * @summary
 * Hook invokes passed callback when component mounts
 */
export function useMountEffect(callback: () => void): void {
  const onMount = useFunction(callback);

  useEffect(() => {
    onMount();
  }, []);
}
