import { useMemo, useState } from 'react';
import { useFunction } from './useFunction';
import { useOnce } from './useOnce';


interface UpdateStateCallback<T> extends CallableFunction {
  (previousState: T): T;
}

interface SetStateFunction<T> extends CallableFunction {
  (newStateArg: T | UpdateStateCallback<T>): void;
}

interface StateFactory<T, S> extends CallableFunction {
  (newPropValue: T): S;
}

interface MutablePropState<S> {
  hasInternalUpdates: boolean;
  stateValue: S;
}

/**
 * May be as alternative for `useState()` when you need update your state by passing updated value.
 * For a case when you need to create some heavy calculations for state initialization,
 * you may pass stateFactory as second argument.
 */
export function usePropState<T>(prop: T): [T, SetStateFunction<T>];
export function usePropState<S, T>(prop: T, stateFactory: StateFactory<T, S>): [S, SetStateFunction<S>];
export function usePropState<S, T>(prop: T, stateFactory?: StateFactory<T, S>): [S, SetStateFunction<S>] {
  const memoizedStateFactory = useFunction<StateFactory<T, S>>((newPropValue): S => {
    return stateFactory ? stateFactory(newPropValue) : newPropValue as unknown as S;
  });
  const stateContainer = useOnce<MutablePropState<S>>(() => ({
    stateValue: null as unknown as S,
    hasInternalUpdates: false,
  }));

  useMemo(() => {
    stateContainer.stateValue = memoizedStateFactory(prop);
    stateContainer.hasInternalUpdates = false;
  }, [prop]);

  const [realState, setRealState] = useState<S>(stateContainer.stateValue);
  const state = stateContainer.hasInternalUpdates ? realState : stateContainer.stateValue;

  const setState = useFunction<SetStateFunction<S>>((newStateArg): void => {
    setRealState(previousRealState => {
      const { hasInternalUpdates, stateValue } = stateContainer;
      const previousState = hasInternalUpdates ? previousRealState : stateValue;
      const newState = isNewStateFunction(newStateArg) ? newStateArg(previousState) : newStateArg;

      stateContainer.hasInternalUpdates = true;

      return newState;
    });
  });

  return [state, setState];
}

function isNewStateFunction<T>(newStateArg: T | UpdateStateCallback<T>): newStateArg is UpdateStateCallback<T> {
  return typeof newStateArg === 'function';
}
