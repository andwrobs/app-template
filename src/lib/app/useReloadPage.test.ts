import { renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useReloadPage } from "./useReloadPage";

afterEach(() => {
	vi.restoreAllMocks();
});

it("reloads the page", () => {
	const reload = vi.fn();
	vi.spyOn(window, "location", "get").mockReturnValue({
		...window.location,
		reload,
	});
	const { result } = renderHook(() => useReloadPage());

	result.current();

	expect(reload).toHaveBeenCalledTimes(1);
});
