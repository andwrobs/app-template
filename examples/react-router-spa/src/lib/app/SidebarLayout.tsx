import type { PropsWithChildren } from "react";
import { useLocation } from "react-router";
import { isCurrent, navLinks } from "~/lib/app/nav";
import { RouteFocus } from "~/lib/app/RouteFocus";
import { SkipLink } from "~/lib/app/SkipLink";
import { ThemeToggle } from "~/lib/app/ThemeToggle";
import { useCloseMobileSidebar } from "~/lib/app/useCloseMobileSidebar";
import { appName } from "~/lib/meta/title";
import { useThemeStore } from "~/lib/theme/theme";
import { Separator } from "~/lib/ui/separator";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from "~/lib/ui/sidebar";
import { Toaster } from "~/lib/ui/sonner";

// The sidebar alternative to AppLayout, for dashboard-style apps. Render it in
// root.tsx instead of AppLayout. It collapses to icons on desktop (Ctrl/Cmd+B)
// and opens as a sheet on small screens.
export function SidebarLayout({ children }: PropsWithChildren) {
	const theme = useThemeStore((state) => state.theme);
	return (
		<SidebarProvider>
			<SkipLink />
			<RouteFocus />
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
					<SidebarTrigger />
					<Separator orientation="vertical" className="h-4" />
					<span className="text-sm font-medium">{appName}</span>
					<div className="ml-auto">
						<ThemeToggle />
					</div>
				</header>
				<div id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
					{children}
				</div>
			</SidebarInset>
			<Toaster theme={theme} />
		</SidebarProvider>
	);
}

function AppSidebar() {
	const { pathname } = useLocation();
	const closeMobileSidebar = useCloseMobileSidebar();
	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="px-3 py-2 text-sm font-semibold group-data-[collapsible=icon]:sr-only">
				{appName}
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Pages</SidebarGroupLabel>
					<SidebarGroupContent>
						<nav aria-label="Main navigation">
							<SidebarMenu>
								{navLinks.map(([to, label, Icon]) => (
									<SidebarMenuItem key={to}>
										<SidebarMenuButton
											href={to}
											isActive={isCurrent(pathname, to)}
											aria-current={
												isCurrent(pathname, to) ? "page" : undefined
											}
											tooltip={label}
											onPress={closeMobileSidebar}
										>
											<Icon aria-hidden />
											<span>{label}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</nav>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
