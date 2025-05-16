import { useEffect } from 'react';
import { useFunction } from './useFunction';

export function useUnmountEffect(callback: () => void): void {
  const onUnmount = useFunction(callback);

  useEffect(() => () => {
    onUnmount();
  }, []);
}
