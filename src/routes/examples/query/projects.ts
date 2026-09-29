import { z } from "zod";

export const projectsSchema = z.array(
	z.object({ id: z.string(), name: z.string(), status: z.string() }),
);

export type Project = z.infer<typeof projectsSchema>[number];

export type Scenario = "default" | "empty" | "error";

export function parseScenario(url: string): Scenario {
	const scenario = new URL(url).searchParams.get("scenario");
	return scenario === "empty" || scenario === "error" ? scenario : "default";
}
