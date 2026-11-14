import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [reactRouter()],
	resolve: {
		// Both examples use the same services, queries, stores, and UI.
		alias: { "~": fileURLToPath(new URL("../src", import.meta.url)) },
	},
});
