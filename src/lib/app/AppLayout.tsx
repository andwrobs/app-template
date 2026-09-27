import type { PropsWithChildren } from "react";

import { AppHeader } from "~/lib/app/AppHeader";
import { useThemeStore } from "~/lib/theme/theme";
import { Toaster } from "~/lib/ui/sonner";

export function AppLayout({ children }: PropsWithChildren) {
	const theme = useThemeStore((state) => state.theme);
	return (
		<div className="flex min-h-svh w-full flex-col bg-background text-foreground">
			<AppHeader />
			{children}
			<Toaster theme={theme} />
		</div>
	);
}
