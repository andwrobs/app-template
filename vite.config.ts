import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vitest/config";

export default defineConfig(({ command, mode }) => ({
	plugins: [
		// Tailwind plugin
		tailwindcss(),

		// Vitest uses @vitejs/plugin-react, React Router uses @react-router/dev/vite
		process.env.VITEST ? react() : reactRouter(),

		// "npm run build:analyze" includes Vite bundle visualizer plugin and outputs to build/stats.html
		command === "build" &&
			mode === "analyze" &&
			visualizer({
				template: "treemap",
				gzipSize: true,
				emitFile: true,
			}),
	].filter(Boolean),

	server: {
		host: true,
		port: 3000, // "npm run dev" will serve the app on this port
	},

	preview: {
		host: true,
		port: 4000, // "npm run build && npm run preview" will serve the production build preview on this port
	},

	resolve: {
		tsconfigPaths: true,
	},

	test: {
		reporters: ["default"],
		globals: true,
		setupFiles: ["./vitest-setup.ts"],
		environment: "jsdom",
		coverage: {
			include: ["src/**/*.{ts,tsx}"],
			exclude: ["src/**/+types/**", "src/**/*.test.{ts,tsx}"],
		},
	},
}));
