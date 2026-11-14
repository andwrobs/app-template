import { expect, it, vi } from "vitest";
import { once } from "./once";

it("builds on the first call and returns the same value afterwards", () => {
	const build = vi.fn(() => ({}));
	const get = once(build);
	expect(build).not.toHaveBeenCalled();
	expect(get()).toBe(get());
	expect(build).toHaveBeenCalledTimes(1);
});
