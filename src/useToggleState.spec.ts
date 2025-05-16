import { describe, expect, test } from 'bun:test';
import { renderHook } from '@testing-library/react';
import { useToggleState } from './useToggleState';
import { act } from 'react';

describe('useToggleState()', () => {
  test('should toggle boolean state', () => {
    const { result } = renderHook(() => {
      return useToggleState(false);
    });

    expect(result.current[0]).toBeFalse();

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBeTrue();
  });

  test.each([
    [true, true],
    [false, false]
  ])('should not change state if manually passed "%p" when current value "%p"', (initValue, newValue) => {
    const { result } = renderHook(() => {
      return useToggleState(initValue);
    });

    expect(result.current[0]).toBe(initValue);

    act(() => {
      result.current[1](newValue);
    });

    expect(result.current[0]).toBe(initValue);
  });
});
