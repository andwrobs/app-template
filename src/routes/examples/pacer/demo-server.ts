import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

// Stand-ins for API calls. Nothing leaves the browser except the fixture read.

const resultsSchema = z.array(z.object({ id: z.string(), title: z.string() }));

// Shorter searches answer more slowly, so an early search can finish after a
// later one. Query keeps each term's answer under its own key and cancels
// searches no screen is watching, so a stale answer never replaces a newer one.
export function searchLatency(term: string) {
	return 300 + 150 * Math.max(0, 5 - term.length);
}

export function searchQuery(term: string) {
	return queryOptions({
		queryKey: ["demo-search", term],
		queryFn: async ({ signal }) => {
			await wait(searchLatency(term), signal);
			const response = await fetch("/demo/tasks.json", { signal });
			if (!response.ok) {
				throw new Error(`Search failed (${response.status}).`);
			}
			const needle = term.toLowerCase();
			return resultsSchema
				.parse(await response.json())
				.filter((task) => task.title.toLowerCase().includes(needle));
		},
		enabled: term !== "",
	});
}

export async function saveNote(text: string) {
	await wait(400);
	return { text, savedAt: Date.now() };
}

function wait(ms: number, signal?: AbortSignal) {
	return new Promise<void>((resolve, reject) => {
		const id = setTimeout(resolve, ms);
		signal?.addEventListener(
			"abort",
			() => {
				clearTimeout(id);
				reject(signal.reason);
			},
			{ once: true },
		);
	});
}
