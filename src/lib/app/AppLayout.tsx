import type { PropsWithChildren } from "react";

import { AppHeader } from "~/lib/app/AppHeader";
import { RouteFocus } from "~/lib/app/RouteFocus";
import { SkipLink } from "~/lib/app/SkipLink";
import { useThemeStore } from "~/lib/theme/theme";
import { Toaster } from "~/lib/ui/sonner";

export function AppLayout({ children }: PropsWithChildren) {
	const theme = useThemeStore((state) => state.theme);
	return (
		<div className="flex min-h-svh w-full flex-col bg-background text-foreground">
			<SkipLink />
			<RouteFocus />
			<AppHeader />
			<div id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
				{children}
			</div>
			<Toaster theme={theme} />
		</div>
	);
}
