import { renderHook } from "@testing-library/react";
import type { FormEvent } from "react";
import { expect, it, vi } from "vitest";
import { useFormSubmit, useSelectChange } from "./handlers";

it("stores the selected key as a string, and a cleared select as empty", () => {
	const field = { handleChange: vi.fn() };
	const { result } = renderHook(() => useSelectChange(field));

	result.current("research");
	result.current(null);

	expect(field.handleChange.mock.calls).toEqual([["research"], [""]]);
});

it("submits once, keeps the page, and leaves failures to the submission owner", async () => {
	const form = {
		state: { isSubmitting: false },
		handleSubmit: vi.fn().mockRejectedValue(new Error("server down")),
	};
	const event = {
		preventDefault: vi.fn(),
		stopPropagation: vi.fn(),
	} as unknown as FormEvent<HTMLFormElement>;
	const { result } = renderHook(() => useFormSubmit(form));

	result.current(event);
	expect(event.preventDefault).toHaveBeenCalled();
	expect(event.stopPropagation).toHaveBeenCalled();
	expect(form.handleSubmit).toHaveBeenCalledTimes(1);

	form.state.isSubmitting = true;
	result.current(event);
	expect(form.handleSubmit).toHaveBeenCalledTimes(1);
	// An unhandled rejection from the first submit would fail the run.
	await Promise.resolve();
});
