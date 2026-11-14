import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, expect, it, vi } from "vitest";
import { useOverlayDemos } from "./useOverlayDemos";

vi.mock("sonner", () => ({
	toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

beforeEach(() => {
	vi.clearAllMocks();
});

it("opens and closes the command palette", () => {
	const { result } = renderHook(() => useOverlayDemos());

	act(() => result.current.openCommand());
	expect(result.current.commandOpen).toBe(true);

	act(() => result.current.closeCommand());
	expect(result.current.commandOpen).toBe(false);
});

it("announces each sample action with a toast", () => {
	const { result } = renderHook(() => useOverlayDemos());
	const demos = result.current;

	demos.rename();
	demos.duplicate();
	demos.copy();
	demos.paste();
	demos.confirmDelete();
	demos.showError();
	demos.showSaved();

	expect(vi.mocked(toast).mock.calls.map(([message]) => message)).toEqual([
		"Renamed",
		"Duplicated",
		"Copied",
		"Pasted",
		"Sample saved",
	]);
	expect(toast.success).toHaveBeenCalledWith("Sample deleted (not really).");
	expect(toast.error).toHaveBeenCalledWith("The sample server is unavailable.");

	const undo = vi.mocked(toast).mock.calls[4]?.[1]?.action as unknown as {
		onClick: () => void;
	};
	undo.onClick();
	expect(toast).toHaveBeenLastCalledWith("Undone");
});
