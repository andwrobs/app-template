import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { usePendingDemo } from "./usePendingDemo";

beforeEach(() => {
	vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});

afterEach(() => {
	vi.useRealTimers();
});

it("shows the pending state for 1.5 s after each press", () => {
	const { result } = renderHook(() => usePendingDemo());

	act(() => result.current.simulateSave());
	expect(result.current.isPending).toBe(true);

	act(() => vi.advanceTimersByTime(1000));
	act(() => result.current.simulateSave());
	act(() => vi.advanceTimersByTime(1000));
	expect(result.current.isPending).toBe(true);

	act(() => vi.advanceTimersByTime(500));
	expect(result.current.isPending).toBe(false);
});
