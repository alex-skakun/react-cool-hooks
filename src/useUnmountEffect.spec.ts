import { describe, expect, mock, test } from 'bun:test';
import { renderHook } from '@testing-library/react';
import { useUnmountEffect } from './useUnmountEffect';

describe('useUnmountEffect()', () => {
  test('should invoke callback once after unmount', () => {
    const callback = mock();
    const { rerender, unmount } = renderHook(() => {
      useUnmountEffect(() => callback());
    });

    rerender();
    rerender();

    expect(callback).toHaveBeenCalledTimes(0);

    unmount();

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
