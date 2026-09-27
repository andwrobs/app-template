import { MoonIcon } from "lucide-react";
import { useThemeStore } from "~/lib/theme/theme";
import { Toggle } from "~/lib/ui/toggle";

export function ThemeToggle() {
	const theme = useThemeStore((state) => state.theme);
	const setTheme = useThemeStore((state) => state.setTheme);
	return (
		<Toggle
			aria-label="Dark theme"
			size="sm"
			isSelected={theme === "dark"}
			onChange={(isDark) => setTheme(isDark ? "dark" : "light")}
		>
			<MoonIcon />
		</Toggle>
	);
}
