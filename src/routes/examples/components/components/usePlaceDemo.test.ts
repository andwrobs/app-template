import { act, renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { usePlaceDemo } from "./usePlaceDemo";

const ids = ["inbox", "projects"] as const;

it("gives each place its own handler", () => {
	const { result } = renderHook(() => usePlaceDemo(ids, "inbox"));
	expect(result.current.place).toBe("inbox");

	act(() => result.current.select.projects());

	expect(result.current.place).toBe("projects");
});
