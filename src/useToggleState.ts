import { useState } from 'react';
import { useFunction } from './useFunction';

export interface SetToggleState extends CallableFunction {
  (newState?: boolean): void;
}

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
