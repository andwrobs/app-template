import { expect, it } from "vitest";
import { parseTableUrlState, writeTableUrlState } from "./table-url-state";

it("falls back to defaults for values it doesn't recognize", () => {
	expect(
		parseTableUrlState(
			new URLSearchParams("status=toString&sort=-secret&page=-3&size=999&q=ok"),
		),
	).toEqual({
		q: "ok",
		status: undefined,
		sort: undefined,
		pageIndex: 0,
		pageSize: 10,
	});
});

it("leaves defaults out, keeps other params, and returns to page 1 on non-paging changes", () => {
	const current = new URLSearchParams("tab=notes&page=3&sort=title");
	expect(writeTableUrlState(current, { status: "done" }).toString()).toBe(
		"tab=notes&sort=title&status=done",
	);
	expect(
		writeTableUrlState(current, { pageIndex: 3, pageSize: 20 }).toString(),
	).toBe("tab=notes&page=4&sort=title&size=20");
	expect(writeTableUrlState(current, { sort: undefined }).toString()).toBe(
		"tab=notes",
	);
});
