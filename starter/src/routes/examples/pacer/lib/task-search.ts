import { z } from "zod";

export const taskResultsSchema = z.array(
	z.object({ id: z.string(), title: z.string() }),
);

export type TaskResult = z.infer<typeof taskResultsSchema>[number];

// Shorter searches answer more slowly, so an early search can finish after a
// later one. Query keeps each term's answer under its own key and cancels
// searches no screen is watching, so a stale answer never replaces a newer one.
export function searchLatency(term: string) {
	return 300 + 150 * Math.max(0, 5 - term.length);
}
