import { create } from "zustand";

export type Theme = "light" | "dark";

const storageKey = "theme";

// Runs in <head> before first paint so a stored or system dark theme never
// flashes light. Keep it in step with applyTheme.
export const themeScript = `(() => {
	try {
		let theme = localStorage.getItem("${storageKey}");
		if (theme !== "light" && theme !== "dark") {
			theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
		}
		document.documentElement.classList.toggle("dark", theme === "dark");
		document.documentElement.style.colorScheme = theme;
	} catch {}
})();`;

// A listed exception to services owning I/O: this only presents and persists the
// store's own state, and it must match the head script.
function applyTheme(theme: Theme) {
	document.documentElement.classList.toggle("dark", theme === "dark");
	document.documentElement.style.colorScheme = theme;
	try {
		localStorage.setItem(storageKey, theme);
	} catch {
		// Storage can be blocked; the choice then lasts for this visit.
	}
}

// Shared by the header toggle and the toaster. Starts from the class the head
// script set; the SPA build renders without a document.
// The header toggle binds setDark by reference.
export function useDarkTheme() {
	const isDark = useThemeStore((state) => state.theme === "dark");
	const setTheme = useThemeStore((state) => state.setTheme);
	return {
		isDark,
		setDark: (dark: boolean) => setTheme(dark ? "dark" : "light"),
	};
}

export const useThemeStore = create<{
	theme: Theme;
	setTheme: (theme: Theme) => void;
}>((set) => ({
	theme:
		typeof document !== "undefined" &&
		document.documentElement.classList.contains("dark")
			? "dark"
			: "light",
	setTheme: (theme) => {
		applyTheme(theme);
		set({ theme });
	},
}));
