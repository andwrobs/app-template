import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { queryClient } from "~/lib/query/client";
import tasks from "../../../../public/demo/tasks.json";
import { renderRoute } from "../../../../test-utils/render-route";
import TableRoute, {
	clientLoader,
	ErrorBoundary,
	meta,
	shouldRevalidate,
} from "./table.route";

const fetchMock = vi.fn();

beforeEach(() => {
	queryClient.clear();
	fetchMock.mockReset().mockImplementation(async () => Response.json(tasks));
	vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
	queryClient.clear();
	vi.unstubAllGlobals();
});

function renderTable(url = "/examples/table") {
	return renderRoute(
		[
			{
				path: "/examples/table",
				Component: TableRoute,
				ErrorBoundary,
				loader: clientLoader,
				meta,
				shouldRevalidate,
			},
		],
		{ initialEntries: [url], queryClient },
	);
}

const titles = () =>
	screen.getAllByRole("rowheader").map((cell) => cell.textContent);
const titlesOf = (list: typeof tasks) => list.map((task) => task.title);
const location = () => screen.getByLabelText("Test location");
const summary = () => screen.getByText(/^Showing/);
const searchBox = () => screen.getByRole("searchbox", { name: "Search" });
const selectAll = () => screen.getByRole("checkbox", { name: "Select All" });

it("opens the view a URL describes", async () => {
	renderTable("/examples/table?status=done&sort=-updated&page=2&size=bad");
	await screen.findAllByRole("rowheader");
	expect(document.title).toBe("Table example · React Router SPA");
	const done = tasks
		.filter((task) => task.status === "done")
		.sort((a, b) => b.updated.localeCompare(a.updated));
	expect(titles()).toEqual(titlesOf(done.slice(10)));
	expect(summary()).toHaveTextContent("Showing 11–12 of 12 tasks · 0 selected");
	expect(screen.getByRole("columnheader", { name: "Updated" })).toHaveAttribute(
		"aria-sort",
		"descending",
	);
	expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("sorts from a header, records it in the URL, and Back restores it", async () => {
	const { user } = renderTable();
	await screen.findAllByRole("rowheader");
	const byPoints = [...tasks].sort((a, b) => a.estimate - b.estimate);

	await user.click(screen.getByRole("columnheader", { name: "Points" }));
	expect(location()).toHaveTextContent("/examples/table?sort=estimate");
	expect(titles()).toEqual(titlesOf(byPoints.slice(0, 10)));

	await user.click(screen.getByRole("columnheader", { name: "Points" }));
	expect(location()).toHaveTextContent("/examples/table?sort=-estimate");
	const first = tasks.find((task) => task.title === titles()[0]);
	expect(first?.estimate).toBe(8);

	await user.click(screen.getByRole("button", { name: "Test back" }));
	expect(location()).toHaveTextContent("/examples/table?sort=estimate");
	expect(titles()).toEqual(titlesOf(byPoints.slice(0, 10)));
	// Search-only navigations skip the loader; the cache already has the rows.
	expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("filters by search and status, and the empty state clears both", async () => {
	const { user } = renderTable("/examples/table?page=2");
	await screen.findAllByRole("rowheader");

	await user.type(searchBox(), "billing");
	const billing = tasks.filter((task) => task.title.includes("billing"));
	expect(location()).toHaveTextContent("/examples/table?q=billing");
	expect(titles()).toEqual(titlesOf(billing));

	await user.click(screen.getByRole("button", { name: /^All statuses/ }));
	await user.click(await screen.findByRole("option", { name: "Canceled" }));
	expect(location()).toHaveTextContent(
		"/examples/table?q=billing&status=canceled",
	);
	expect(titles()).toEqual(
		titlesOf(billing.filter((task) => task.status === "canceled")),
	);

	// Typing replaces the entry; Back returns to the search before the status.
	await user.type(searchBox(), " zzz");
	expect(
		screen.getByText("No tasks match this search and status."),
	).toBeInTheDocument();
	await user.click(screen.getByRole("button", { name: "Test back" }));
	expect(location()).toHaveTextContent("/examples/table?q=billing");
	expect(searchBox()).toHaveValue("billing");
	expect(titles()).toEqual(titlesOf(billing));

	await user.type(searchBox(), " zzz");
	expect(
		screen.getByText("No tasks match this search and status."),
	).toBeInTheDocument();
	await user.click(
		screen.getByRole("button", { name: "Clear search and status" }),
	);
	expect(location()).toHaveTextContent(/^\/examples\/table$/);
	expect(searchBox()).toHaveValue("");
	expect(titles()).toEqual(titlesOf(tasks.slice(0, 10)));
});

it("pages, changes page size, and recovers from a page past the end", async () => {
	const { user } = renderTable("/examples/table?page=9");
	await user.click(
		await screen.findByRole("button", { name: "Go to the first page" }),
	);
	expect(titles()).toEqual(titlesOf(tasks.slice(0, 10)));
	expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

	await user.click(screen.getByRole("button", { name: "Next" }));
	expect(location()).toHaveTextContent("/examples/table?page=2");
	expect(titles()).toEqual(titlesOf(tasks.slice(10, 20)));

	await user.click(screen.getByRole("button", { name: /per page/ }));
	await user.click(await screen.findByRole("option", { name: "20" }));
	expect(location()).toHaveTextContent("/examples/table?size=20");
	expect(titles()).toEqual(titlesOf(tasks.slice(0, 20)));
});

it("keeps selection by row ID across pages and sorting", async () => {
	const { user } = renderTable();
	await screen.findAllByRole("rowheader");

	await user.click(
		screen.getByRole("checkbox", {
			name: "Select Draft sample onboarding copy",
		}),
	);
	expect(selectAll()).toBePartiallyChecked();
	await user.click(selectAll());
	expect(selectAll()).toBeChecked();
	expect(summary()).toHaveTextContent("10 selected");

	await user.click(screen.getByRole("button", { name: "Next" }));
	expect(selectAll()).not.toBeChecked();
	expect(selectAll()).not.toBePartiallyChecked();
	await user.click(
		screen.getAllByRole("checkbox", { name: /^Select (?!All)/ })[0],
	);
	expect(summary()).toHaveTextContent("11 selected");

	// Sorting by ID descending moves TASK-001 to the last page.
	await user.click(screen.getByRole("columnheader", { name: "ID" }));
	await user.click(screen.getByRole("columnheader", { name: "ID" }));
	for (let page = 1; page < 5; page++) {
		await user.click(screen.getByRole("button", { name: "Next" }));
	}
	expect(
		screen.getByRole("row", { name: /Draft sample onboarding copy/ }),
	).toHaveAttribute("aria-selected", "true");
	expect(summary()).toHaveTextContent("11 selected");

	await user.click(screen.getByRole("button", { name: "Clear selection" }));
	expect(summary()).toHaveTextContent("0 selected");
});

it("hides a column from the Columns menu", async () => {
	const { user } = renderTable();
	await screen.findAllByRole("rowheader");
	await user.click(screen.getByRole("button", { name: "Columns" }));
	await user.click(
		await screen.findByRole("menuitemcheckbox", { name: "Priority" }),
	);
	await user.keyboard("{Escape}");
	await waitFor(() =>
		expect(screen.getByRole("button", { name: "Columns" })).toHaveFocus(),
	);
	expect(
		screen.queryByRole("columnheader", { name: "Priority" }),
	).not.toBeInTheDocument();
	const firstRow = screen.getByRole("row", {
		name: /Draft sample onboarding copy/,
	});
	expect(within(firstRow).getAllByRole("gridcell")).toHaveLength(5);
});

it("shows the route error boundary when the tasks fail to load", async () => {
	fetchMock.mockImplementation(async () => new Response(null, { status: 503 }));
	renderTable();
	expect(
		await screen.findByText("Tasks could not load.", {}, { timeout: 3000 }),
	).toBeInTheDocument();
});
