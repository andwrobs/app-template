import { FolderIcon, InboxIcon, SettingsIcon } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
} from "~/lib/ui/breadcrumb";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "~/lib/ui/pagination";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from "~/lib/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/lib/ui/tabs";
import { Demo, Section } from "./Demo";

const pages = [1, 2, 3];
const places = [
	{ id: "inbox", label: "Inbox", icon: InboxIcon, badge: 4 },
	{ id: "projects", label: "Projects", icon: FolderIcon },
	{ id: "settings", label: "Settings", icon: SettingsIcon },
];

export function NavigationSection() {
	const [searchParams] = useSearchParams();
	const page = Number(searchParams.get("page") ?? 1);
	const [place, setPlace] = useState("inbox");
	const pageHref = (target: number) => `?page=${target}`;

	return (
		<Section
			id="navigation"
			title="Navigation"
			description="Links navigate through the router, so they work with Back, deep links, and modifier-click."
		>
			<Demo title="Tabs" className="grid">
				<Tabs defaultSelectedKey="overview">
					<TabsList aria-label="Sample project">
						<TabsTrigger id="overview">Overview</TabsTrigger>
						<TabsTrigger id="activity">Activity</TabsTrigger>
						<TabsTrigger id="settings" isDisabled>
							Settings
						</TabsTrigger>
					</TabsList>
					<TabsContent id="overview" className="text-sm">
						Arrow keys move between tabs; Tab moves into the panel.
					</TabsContent>
					<TabsContent id="activity" className="text-sm">
						No activity on this sample yet.
					</TabsContent>
				</Tabs>
			</Demo>
			<Demo title="Breadcrumb and pagination" className="grid">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/">Overview</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbItem>
							<BreadcrumbPage>Components</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<Pagination aria-label="Sample pages">
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								href={pageHref(Math.max(1, page - 1))}
								isDisabled={page <= 1}
							/>
						</PaginationItem>
						{pages.map((target) => (
							<PaginationItem key={target}>
								<PaginationLink
									href={pageHref(target)}
									isActive={page === target}
								>
									{target}
								</PaginationLink>
							</PaginationItem>
						))}
						<PaginationItem>
							<PaginationNext
								href={pageHref(Math.min(pages.length, page + 1))}
								isDisabled={page >= pages.length}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</Demo>
			<Demo title="Sidebar (static, inside a frame)" className="block">
				<SidebarProvider className="min-h-0 overflow-hidden rounded-lg border">
					<Sidebar collapsible="none" className="h-56 w-full">
						<SidebarHeader className="px-4 text-sm font-medium">
							Sample workspace
						</SidebarHeader>
						<SidebarContent>
							<SidebarGroup>
								<SidebarGroupLabel>Places</SidebarGroupLabel>
								<SidebarGroupContent>
									<SidebarMenu>
										{places.map((item) => (
											<SidebarMenuItem key={item.id}>
												<SidebarMenuButton
													isActive={place === item.id}
													onPress={() => setPlace(item.id)}
												>
													<item.icon aria-hidden />
													<span>{item.label}</span>
												</SidebarMenuButton>
												{item.badge && (
													<SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
												)}
											</SidebarMenuItem>
										))}
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						</SidebarContent>
					</Sidebar>
				</SidebarProvider>
			</Demo>
		</Section>
	);
}
