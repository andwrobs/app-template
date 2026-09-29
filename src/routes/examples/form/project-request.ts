import { z } from "zod";

export const teams = [
	{ value: "design", label: "Design" },
	{ value: "engineering", label: "Engineering" },
	{ value: "research", label: "Research" },
] as const;

// Validates the form's values. The output trims strings, but TanStack keeps the
// raw input in the fields; the submit handler parses again for the output.
export const projectRequestSchema = z.object({
	name: z
		.string()
		.trim()
		.min(3, "Use at least 3 characters.")
		.max(60, "Use 60 characters or fewer."),
	email: z
		.string()
		.trim()
		.pipe(z.email("Enter an email address such as you@example.com.")),
	team: z.enum(["design", "engineering", "research"], "Choose a team."),
	details: z
		.string()
		.trim()
		.min(20, "Describe the project in at least 20 characters.")
		.max(500, "Keep the description to 500 characters or fewer."),
	confirm: z.literal(true, "Confirm the request contains only sample data."),
});

export type ProjectRequest = z.output<typeof projectRequestSchema>;

export type ProjectRequestValues = {
	name: string;
	email: string;
	team: string;
	details: string;
	confirm: boolean;
};

export const emptyProjectRequest: ProjectRequestValues = {
	name: "",
	email: "",
	team: "",
	details: "",
	confirm: false,
};

// The demo server fails when the URL asks it to.
export type ServerScenario = "default" | "error";

export function parseServerScenario(search: URLSearchParams): ServerScenario {
	return search.get("scenario") === "error" ? "error" : "default";
}
