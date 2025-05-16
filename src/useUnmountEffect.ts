import { useEffect } from 'react';
import { useFunction } from './useFunction';

/**
 * @summary
 * Hook invokes passed callback when component unmounts
 */
export function useUnmountEffect(callback: () => void): void {
  const onUnmount = useFunction(callback);

  useEffect(() => () => {
    onUnmount();
  }, []);
}
