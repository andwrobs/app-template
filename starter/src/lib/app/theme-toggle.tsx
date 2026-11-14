import { MoonIcon } from "lucide-react";
import { useDarkTheme } from "~/lib/theme/theme";
import { Toggle } from "~/lib/ui/toggle";

export function ThemeToggle() {
	const { isDark, setDark } = useDarkTheme();
	return (
		<Toggle
			aria-label="Dark theme"
			size="sm"
			isSelected={isDark}
			onChange={setDark}
		>
			<MoonIcon />
		</Toggle>
	);
}
