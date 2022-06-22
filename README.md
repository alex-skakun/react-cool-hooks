# react-cool-hooks

Helpful hooks for React.

## `useOnce()`

This hook is a safe alternative for `useMemo(factory, [])`. 
According to React documentation, `useMemo()` doesn't guarantee that hook result is stable.
So, for cases when you need to create something once and till component unmount use hook `useOnce(factory)`:

```typescript jsx
import { useOnce } from 'react-cool-hooks';

export function MyComponent() {
  const stableState = useOnce(() => {
    // here I'm making my state and returning it
    // this function will be called only once
  });
  
  // I can be sure that MemoizedComponent receives 
  // always the same value for data prop
  return <MemoizedComponent data={stableState} />
}
```

## `useFunction()`

This hook provides stable function that invokes passed callback. 
It doesn't require dependencies, because callback is always up-to-date.
Use it as alternative for `useCallback()`:

```typescript jsx
import { useState } from 'react';
import { useFunction } from 'react-cool-hooks';

export function MyComponent() {
  const [counter, setCounter] = useState(0);
  
  const incrementCounter = useFunction(() => {
    setCounter(currentCounter => currentCounter++);
  });
  
  const doSomethingWithCounter = useFunction(data => {
    // here I can use received data from child component
    // and I don't need specify dependencies to have access 
    // to latest value of counter, it's always up-to-date.
  });
  
  // incrementCounter and doSomethingWithCounter are stable and always the same
  
  return <>
    <button type="button" onClick={incrementCounter}>Increment</button>
    <MemoizedComponent onHandle={doSomethingWithCounter} />
  </>;
}
```

## `usePropState()`

May be as alternative for `useState()` when you need update your state by passing updated value.

```typescript jsx
import { useState } from 'react';
import { usePropState } from 'react-cool-hooks';

export function MyComponent({ someProp }) {
  // nativeState may be updated only by calling setNativeState();
  const [nativeState, setNativeState] = useState(someProp);
  
  // coolState may be updated by setCoolState() and by passing updated value of someProp
  const [coolState, setCoolState] = usePropState(someProp);
  
  return <SomeJSX/>;
}
```

For a case when you need to create some heavy calculations for state initialization, 
you may pass stateFactory as second argument:

```typescript jsx
import { usePropState } from 'react-cool-hooks';

export function MyComponent({ someProp }) {
  const [state, setState] = usePropState(someProp, actualValueOfSomeProp => {
    // this factory will ne invoked every time usePropState() receives new value of someProp
    // init your state and return it
  });
  
  return <SomeJSX/>;
}
```

## License

MIT