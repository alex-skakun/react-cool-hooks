import { describe, expect, mock, test } from 'bun:test';
import { renderHook } from '@testing-library/react';
import { useMountEffect } from './useMountEffect';

describe('useMountEffect()', () => {
  test('should invoke callback once after mount', () => {
    const callback = mock();
    const { rerender } = renderHook(() => {
      useMountEffect(() => callback());
    });

    rerender();
    rerender();

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
