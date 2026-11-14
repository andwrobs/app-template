import { z } from "zod";

// Every VITE_ setting the app reads. Vite inlines them into the client bundle,
// so they're public: never put secrets here. Keep .env.example in step.
export const envSchema = z.object({
	VITE_API_URL: z
		.string()
		.default("/api")
		.refine(
			(value) =>
				value.startsWith("/") ||
				(/^https?:\/\//.test(value) && URL.canParse(value)),
			"Use a path starting with / or an absolute http(s) URL.",
		),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, unknown>): Env {
	const result = envSchema.safeParse(source);
	if (result.success) return result.data;
	const problems = result.error.issues
		.map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
		.join("\n");
	throw new Error(
		`Invalid environment settings:\n${problems}\nSee .env.example.`,
	);
}
