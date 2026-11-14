import { z } from "zod";

const schema = z.object({
	VITE_APP_NAME: z.string().default("App"),
	VITE_SUPPORT_URL: z.url().optional(),
});

/**
 * Build-time settings, checked once when the app starts. Nothing else reads
 * `import.meta.env`, except for `import.meta.env.DEV`.
 */
export const env = schema.parse(import.meta.env);
