import { act, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderRoute } from "../../../../test-utils/render-route";
import ComponentsRoute from "./components.route";

// jsdom lacks the layout APIs the chart and carousel read.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	vi.stubGlobal("ResizeObserver", ResizeObserverStub);
	vi.stubGlobal("IntersectionObserver", ResizeObserverStub);
	vi.stubGlobal("matchMedia", (query: string) => ({
		matches: false,
		media: query,
		addEventListener: () => undefined,
		removeEventListener: () => undefined,
		addListener: () => undefined,
		removeListener: () => undefined,
	}));
	consoleError = vi.spyOn(console, "error");
});

afterEach(() => {
	vi.unstubAllGlobals();
	consoleError.mockRestore();
});

function renderComponents() {
	return renderRoute(
		[{ path: "/examples/components", Component: ComponentsRoute }],
		{ initialEntries: ["/examples/components"] },
	);
}

it("renders every family without errors", () => {
	renderComponents();
	for (const family of [
		"Inputs and fields",
		"Selection",
		"Overlays and menus",
		"Navigation",
		"Layout and display",
		"Collections and dates",
	]) {
		expect(screen.getByRole("region", { name: family })).toBeInTheDocument();
	}
	expect(consoleError).not.toHaveBeenCalled();
});

it("links field errors and descriptions to their controls", () => {
	renderComponents();
	const username = screen.getByRole("textbox", { name: "Username" });
	expect(username).toHaveAttribute("aria-invalid", "true");
	expect(username).toHaveAccessibleDescription(
		"Type a third character to fix it. Use at least 3 characters.",
	);
	expect(screen.getByRole("textbox", { name: "Disabled" })).toBeDisabled();
});

it("returns focus to the trigger when a modal closes", async () => {
	const { user } = renderComponents();
	const trigger = screen.getByRole("button", { name: "Edit profile" });
	act(() => trigger.focus());
	await user.keyboard("{Enter}");
	const dialog = await screen.findByRole("dialog", { name: "Edit profile" });
	expect(within(dialog).getByRole("textbox", { name: "Name" })).toHaveFocus();
	await user.keyboard("{Escape}");
	await waitFor(() => expect(trigger).toHaveFocus());
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("filters the command palette and closes it with Escape", async () => {
	const { user } = renderComponents();
	const trigger = screen.getByRole("button", { name: "Open command palette" });
	act(() => trigger.focus());
	await user.keyboard("{Enter}");
	await user.keyboard("sea");
	const dialog = await screen.findByRole("dialog");
	expect(
		within(dialog)
			.getAllByRole("menuitem")
			.map((item) => item.textContent),
	).toEqual(["Search tasks"]);
	await user.keyboard("{Escape}{Escape}");
	await waitFor(() => expect(trigger).toHaveFocus());
});
