import { useState } from 'react';
import { useFunction } from './useFunction';

export interface SetToggleState extends CallableFunction {
  (newState?: boolean): void;
}

/**
 * @summary
 * Hook for boolean state. Provides an easy way to toggle and control boolean state.
 */
export function useToggleState(initial: boolean = false): [boolean, SetToggleState] {
  const [state, setState] = useState(initial);

  const toggleState = useFunction<SetToggleState>((newState) => {
    if (typeof newState === 'boolean') {
      setState(newState);
    } else {
      setState((currentState) => !currentState);
    }
  });

  return [state, toggleState];
}
