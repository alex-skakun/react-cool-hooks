import { useState } from 'react';


export function useOnce<T>(factory: () => T): T {
  const [value] = useState<T>(factory);

  return value;
}