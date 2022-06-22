import { useState } from 'react';


/**
 * This hook is a safe alternative for `useMemo(factory, [])`.
 * According to React documentation, `useMemo()` doesn't guarantee that hook result is stable.
 * So, for cases when you need to create something once and till component unmount use hook `useOnce(factory)`
 */
export function useOnce<T>(factory: () => T): T {
  const [value] = useState<T>(factory);

  return value;
}
