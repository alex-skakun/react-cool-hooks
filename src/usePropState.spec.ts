import { act, renderHook, RenderHookOptions } from '@testing-library/react';
import { usePropState } from './usePropState';


describe('usePropState()', () => {
  type TestProps = {
    run: number;
  };

  type TestState = {
    prop: number;
  };

  let initialProps: TestProps;
  let hookOption: RenderHookOptions<TestProps>;

  beforeEach(() => {
    initialProps = { run: 1 };
    hookOption = { initialProps: initialProps };
  });

  it('should return same state if prop is unchanged', () => {
    const { result, rerender } = renderHook(({ run = 1 }) => {
      const [state] = usePropState(run);

      return state;
    }, hookOption);

    const firstState = result.current;
    rerender({ run: 1 });
    const secondState = result.current;

    expect(firstState).toBe(secondState);
  });

  it('should return same setState function', () => {
    const { result, rerender } = renderHook(({ run = 1 }) => {
      const [, setState] = usePropState(run);

      return setState;
    }, hookOption);

    const firstSetState = result.current;
    rerender({ run: 2 });
    const secondSetState = result.current;

    expect(firstSetState).toBe(secondSetState);
  });

  it('should return new state if prop changed', () => {
    const { result, rerender } = renderHook(({ run = 1 }) => {
      const [state] = usePropState(run);

      return state;
    }, hookOption);

    expect(result.current).toBe(1);
    rerender({ run: 2 });
    expect(result.current).toBe(2);
  });

  it('should return same state if prop is unchanged using factory', () => {
    const factory = jest.fn((prop) => ({ prop: prop }));
    const { result, rerender } = renderHook(({ run = 1 }) => {
      const [state] = usePropState(run, factory);

      return state;
    }, hookOption);

    const firstState = result.current;
    rerender({ run: 1 });
    const secondState = result.current;

    expect(firstState).toBe(secondState);
  });

  it('should return new state if prop changed using factory', () => {
    const factory = jest.fn((prop) => ({ prop: prop }));
    const { result, rerender } = renderHook(({ run = 1 }) => {
      const [state] = usePropState(run, factory);

      return state;
    }, hookOption);

    expect(result.current).toEqual({ prop: 1 });
    expect(factory).toHaveBeenCalledWith(1);

    rerender({ run: 2 });

    expect(result.current).toEqual({ prop: 2 });
    expect(factory).toHaveBeenCalledWith(2);
  });

  it('should not invoke factory for unchanged prop', () => {
    const factory = jest.fn((prop) => ({ prop: prop }));
    const { rerender } = renderHook(({ run = 1 }) => {
      const [state] = usePropState(run, factory);

      return state;
    }, hookOption);

    rerender({ run: 1 });
    rerender({ run: 1 });
    rerender({ run: 1 });

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('should provide updated state after internal change using new state object', () => {
    const factory = jest.fn((prop) => ({ prop: prop }));
    const { result } = renderHook(({ run = 1 }) => {
      const [state, setState] = usePropState(run, factory);

      return { state: state, setState: setState };
    }, hookOption);

    expect(result.current.state).toEqual({ prop: 1 });

    act(() => {
      result.current.setState({ prop: 2 });
    });

    expect(result.current.state).toEqual({ prop: 2 });
  });

  it('should provide updated state after internal change using state update function', () => {
    const factory = jest.fn((prop: number): TestState => ({ prop: prop }));
    const { result } = renderHook(({ run = 1 }) => {
      const [state, setState] = usePropState<TestState, number>(run, factory);

      return { state: state, setState: setState };
    }, hookOption);

    expect(result.current.state).toEqual({ prop: 1 });

    act(() => {
      result.current.setState(({ prop }) => ({ prop: prop + 1 }));
    });

    expect(result.current.state).toEqual({ prop: 2 });
  });

  it('should receive correct previous state when passing a callback into setState', () => {
    const { result } = renderHook(() => {
      const [, setState] = usePropState(null, () => {
        return { stateVersion: 1 };
      });

      return setState;
    });

    act(() => {
      result.current(previousState => {
        expect(previousState.stateVersion).toBe(1);

        return { stateVersion: 2 };
      });
    });

    act(() => {
      result.current(previousState => {
        expect(previousState.stateVersion).toBe(2);

        return { stateVersion: 3 };
      });
    });
  });
});
