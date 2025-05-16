import { useEffect } from 'react';
import { useFunction } from './useFunction';

export function useMountEffect(callback: () => void): void {
  const onMount = useFunction(callback);

  useEffect(() => {
    onMount();
  }, []);
}
