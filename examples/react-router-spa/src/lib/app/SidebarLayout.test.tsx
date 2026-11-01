import { screen, waitFor, within } from "@testing-library/react";
import { Outlet } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderRoute } from "../../../test-utils/render-route";
import { navLinks } from "./nav";
import { SidebarLayout } from "./SidebarLayout";

beforeEach(() => {
	vi.stubGlobal("innerWidth", 1024);
	vi.stubGlobal("matchMedia", (query: string) => ({
		matches: false,
		media: query,
		addEventListener: () => undefined,
		removeEventListener: () => undefined,
	}));
});

afterEach(() => {
	vi.unstubAllGlobals();
});

function renderShell() {
	const page = (title: string) => () => (
		<main>
			<h1>{title}</h1>
		</main>
	);
	return renderRoute([
		{
			Component: () => (
				<SidebarLayout>
					<Outlet />
				</SidebarLayout>
			),
			children: [{ path: "/", Component: page("Overview") }],
		},
	]);
}

it("lists every nav link and marks the current page", () => {
	renderShell();
	const nav = screen.getByRole("navigation", { name: "Main navigation" });
	const links = within(nav).getAllByRole("link");
	expect(links.map((link) => link.textContent)).toEqual(
		navLinks.map(([, label]) => label),
	);
	expect(within(nav).getByRole("link", { name: "Overview" })).toHaveAttribute(
		"aria-current",
		"page",
	);
	expect(screen.getAllByRole("main")).toHaveLength(1);
});

it("collapses and expands from the header trigger", async () => {
	const { user, container } = renderShell();
	const trigger = within(screen.getByRole("banner")).getByRole("button", {
		name: "Toggle Sidebar",
	});
	const sidebar = () => container.querySelector("[data-state]");
	expect(sidebar()).toHaveAttribute("data-state", "expanded");
	await user.click(trigger);
	expect(sidebar()).toHaveAttribute("data-state", "collapsed");
	await user.click(trigger);
	expect(sidebar()).toHaveAttribute("data-state", "expanded");
});

it("opens as a sheet on small screens and closes after a choice", async () => {
	vi.stubGlobal("innerWidth", 500);
	const { user } = renderShell();
	expect(
		screen.queryByRole("navigation", { name: "Main navigation" }),
	).not.toBeInTheDocument();
	await user.click(
		within(screen.getByRole("banner")).getByRole("button", {
			name: "Toggle Sidebar",
		}),
	);
	const sheet = await screen.findByRole("dialog");
	await user.click(within(sheet).getByRole("link", { name: "Overview" }));
	await waitFor(() =>
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
	);
});
