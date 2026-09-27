// @vitest-environment node
import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import {
	checkComponents,
	checkRouterSkill,
	findNewComponents,
	readInventory,
	renderReport,
} from "./check-upstream.mjs";

const hash = (text) =>
	createHash("sha256").update(text).digest("hex").slice(0, 16);

// A fake network: URL → body, status, or a thrown error.
function fakeFetch(routes) {
	return async (url) => {
		const route = routes[url];
		if (route === undefined) return new Response("", { status: 404 });
		if (route instanceof Error) throw route;
		return new Response(route);
	};
}

const base = "https://ui.shadcn.com/r/styles/aria-nova";

it("reads names and hashes from the inventory table", () => {
	expect(
		readInventory(
			"| badge | `4a6f5d7176426546` | | | none |\n| text-field | local | field |",
		),
	).toEqual([{ name: "badge", hash: "4a6f5d7176426546" }]);
});

it("tells unchanged, changed, and unavailable components apart", async () => {
	const results = await checkComponents(
		[
			{ name: "same", hash: hash("v1") },
			{ name: "moved", hash: hash("v1") },
			{ name: "gone", hash: hash("v1") },
			{ name: "offline", hash: hash("v1") },
		],
		fakeFetch({
			[`${base}/same.json`]: "v1",
			[`${base}/moved.json`]: "v2",
			[`${base}/offline.json`]: new TypeError("fetch failed"),
		}),
	);
	expect(results.map((result) => result.status)).toEqual([
		"unchanged",
		"changed",
		"unavailable",
		"unavailable",
	]);
	expect(results[2].detail).toBe("HTTP 404");
	expect(results[3].detail).toBe("fetch failed");
});

it("finds registry components the inventory doesn't have", async () => {
	const found = await findNewComponents(
		new Set(["badge"]),
		fakeFetch({
			"https://ui.shadcn.com/llms.txt":
				"docs/components/badge docs/components/drawer docs/components/rating docs/components/only-docs",
			[`${base}/rating.json`]: "{}",
		}),
	);
	expect(found).toEqual({ names: ["rating"] });
});

it("flags a newer create-react-router and an unreachable registry", async () => {
	const npm = "https://registry.npmjs.org/create-react-router/latest";
	expect(
		await checkRouterSkill(
			"8.4.0",
			fakeFetch({ [npm]: '{"version":"8.5.0"}' }),
		),
	).toEqual({ status: "changed", detail: "8.4.0 → 8.5.0" });
	expect(
		await checkRouterSkill(
			"8.4.0",
			fakeFetch({ [npm]: '{"version":"8.4.0"}' }),
		),
	).toEqual({ status: "unchanged", detail: "8.4.0" });
	expect((await checkRouterSkill("8.4.0", fakeFetch({}))).status).toBe(
		"unavailable",
	);
});

it("renders only what needs attention, with counts", () => {
	const report = renderReport({
		date: "2026-10-01",
		components: [
			{ name: "badge", status: "unchanged" },
			{ name: "select", status: "changed", detail: "aaa → bbb" },
		],
		added: { names: [] },
		skill: { status: "unchanged", detail: "8.4.0" },
		packages: [{ name: "zod", status: "unavailable", detail: "HTTP 503" }],
	});
	expect(report).toContain("- changed: select (aaa → bbb)");
	expect(report).toContain("1 of 2 unchanged.");
	expect(report).toContain("- unavailable: zod (HTTP 503)");
	expect(report).not.toContain("badge");
});
