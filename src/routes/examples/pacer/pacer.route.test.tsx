import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderRoute } from "../../../../test-utils/render-route";
import { searchWait } from "./components/DebouncedSearch/useDebouncedSearch";
import { saveInterval } from "./components/ThrottledAutosave/useThrottledAutosave";
import { saveNote, searchLatency } from "./demo-server";
import PacerRoute, { meta } from "./pacer.route";

const server = vi.hoisted(() => ({
	inFlight: 0,
	maxInFlight: 0,
	stored: [] as string[],
}));

vi.mock("./demo-server", async (importOriginal) => ({
	...(await importOriginal<typeof import("./demo-server")>()),
	saveNote: vi.fn(async (text: string, serverFails: boolean) => {
		server.inFlight++;
		server.maxInFlight = Math.max(server.maxInFlight, server.inFlight);
		await new Promise((resolve) => setTimeout(resolve, 400));
		server.inFlight--;
		if (serverFails) throw new Error("The demo server is unavailable.");
		server.stored.push(text);
		return { text, savedAt: Date.now() };
	}),
}));

const tasks = [
	{ id: "T-1", title: "Sample dashboard" },
	{ id: "T-2", title: "Sample report" },
	{ id: "T-3", title: "Demo billing" },
];
const fetchMock = vi.fn();

beforeEach(() => {
	// Fake the app's timers and clock; React's scheduler keeps its real
	// setImmediate so renders still flush.
	vi.useFakeTimers({
		toFake: [
			"setTimeout",
			"clearTimeout",
			"setInterval",
			"clearInterval",
			"Date",
		],
	});
	server.inFlight = 0;
	server.maxInFlight = 0;
	server.stored = [];
	vi.mocked(saveNote).mockClear();
	fetchMock.mockReset().mockImplementation(async () => Response.json(tasks));
	vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

function renderPacer(initialEntries = ["/examples/pacer"]) {
	return renderRoute(
		[
			{ path: "/examples/pacer", Component: PacerRoute, meta },
			{ path: "/other", Component: () => <p>Other page</p> },
		],
		{ initialEntries, userOptions: { advanceTimers: vi.advanceTimersByTime } },
	);
}

const elapse = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
// Query delivers results on a zero-delay timer after the fetch resolves.
const answer = (term: string) => elapse(searchLatency(term) + 1);
// The mock server answers after 400 ms, and Query reports it the same way.
const saveSettles = () => elapse(401);
const location = () => screen.getByLabelText("Test location");
const searchBox = () =>
	screen.getByRole("searchbox", { name: "Search sample tasks" });
const notes = () => screen.getByRole("textbox", { name: "Notes" });
const statusOf = (heading: string) =>
	screen.getByRole("region", { name: heading }).querySelector("[role=status]");
const searchStatus = () => statusOf("Debounce a value: search");
const saveStatus = () => statusOf("Throttle a mutation: autosave");
// Every text sent to the server, including saves that fail.
const sentTexts = () => vi.mocked(saveNote).mock.calls.map(([text]) => text);
const discardButton = () =>
	screen.getByRole("button", { name: "Discard waiting save" });
const resultTitles = () =>
	screen
		.queryAllByRole("listitem")
		.map((item) => item.textContent?.replace(/^T-\d/, ""));

it("waits for a pause, then writes the URL and searches once", async () => {
	const { user } = renderPacer();
	expect(document.title).toBe("Pacer example · React Router SPA");
	await user.type(searchBox(), "sample");
	expect(searchStatus()).toHaveTextContent("Waiting for you to pause…");
	await elapse(searchWait - 1);
	expect(location()).toHaveTextContent(/^\/examples\/pacer$/);

	await elapse(1);
	expect(location()).toHaveTextContent("/examples/pacer?q=sample");
	expect(screen.getByText("6 keystrokes · 1 search")).toBeInTheDocument();
	await answer("sample");
	expect(searchStatus()).toHaveTextContent("2 tasks match “sample”.");
	expect(resultTitles()).toEqual(["Sample dashboard", "Sample report"]);
	expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("only shows the answer for the latest search", async () => {
	const { user } = renderPacer();
	await user.type(searchBox(), "sa");
	await elapse(searchWait);
	expect(location()).toHaveTextContent("?q=sa");

	// "sa" answers slower than "sample", so it would finish last.
	await user.type(searchBox(), "mple");
	await elapse(searchWait);
	await answer("sample");
	expect(resultTitles()).toEqual(["Sample dashboard", "Sample report"]);
	await answer("sa");
	expect(resultTitles()).toEqual(["Sample dashboard", "Sample report"]);
	expect(searchStatus()).toHaveTextContent("2 tasks match “sample”.");
	// Query cancelled the unwatched "sa" search before it fetched.
	expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("searches now on Enter, and Cancel drops a waiting search", async () => {
	const { user } = renderPacer();
	await user.type(searchBox(), "demo{Enter}");
	await elapse(0);
	expect(location()).toHaveTextContent("/examples/pacer?q=demo");

	await user.type(searchBox(), "x");
	await user.click(screen.getByRole("button", { name: "Cancel" }));
	expect(searchBox()).toHaveValue("demo");
	await elapse(searchWait * 2);
	expect(location()).toHaveTextContent("/examples/pacer?q=demo");
	expect(screen.getByRole("button", { name: "Search now" })).toBeDisabled();
});

it("waits for IME composition to finish", async () => {
	renderPacer();
	fireEvent.compositionStart(searchBox());
	fireEvent.change(searchBox(), { target: { value: "samp" } });
	await elapse(searchWait * 2);
	expect(location()).toHaveTextContent(/^\/examples\/pacer$/);

	fireEvent.change(searchBox(), { target: { value: "sample" } });
	fireEvent.compositionEnd(searchBox());
	await elapse(searchWait);
	expect(location()).toHaveTextContent("/examples/pacer?q=sample");
});

it("clears the search at once when the box is cleared", async () => {
	const { user } = renderPacer();
	await user.type(searchBox(), "sample");
	await elapse(searchWait);
	await answer("sample");
	await user.clear(searchBox());
	await elapse(0);
	expect(location()).toHaveTextContent(/^\/examples\/pacer$/);
	expect(searchStatus()).toHaveTextContent("Type to search the sample tasks.");
	expect(resultTitles()).toEqual([]);
});

it("drops a waiting search when Back changes the URL or the page unmounts", async () => {
	const { user } = renderPacer([
		"/other",
		"/examples/pacer?q=demo",
		"/examples/pacer?q=sample",
	]);
	expect(searchBox()).toHaveValue("sample");
	await user.type(searchBox(), "x");
	await user.click(screen.getByRole("button", { name: "Test back" }));
	expect(searchBox()).toHaveValue("demo");
	await elapse(searchWait * 2);
	expect(location()).toHaveTextContent("/examples/pacer?q=demo");

	await user.type(searchBox(), "y");
	await user.click(screen.getByRole("button", { name: "Test back" }));
	expect(screen.getByText("Other page")).toBeInTheDocument();
	await elapse(searchWait * 2);
	expect(location()).toHaveTextContent(/^\/other$/);
});

it("saves at most once a second, one at a time, and saves the last edit", async () => {
	const { user } = renderPacer();
	for (const character of "throttled") {
		await user.type(notes(), character);
		await elapse(150);
	}
	await elapse(saveInterval * 3);
	const calls = sentTexts();
	expect(calls.at(-1)).toBe("throttled");
	expect(calls.length).toBeLessThanOrEqual(3);
	expect(server.maxInFlight).toBe(1);
	expect(saveStatus()).toHaveTextContent(/^All changes saved at/);
});

it("saves now, discards a waiting save, and saves the last edit on unmount", async () => {
	const { user } = renderPacer(["/other", "/examples/pacer"]);
	await user.type(notes(), "a");
	await elapse(400);
	await user.type(notes(), "b");
	expect(saveStatus()).toHaveTextContent("Save waiting…");
	await user.click(screen.getByRole("button", { name: "Save now" }));
	await elapse(400);
	expect(sentTexts()).toEqual(["a", "ab"]);
	expect(saveStatus()).toHaveTextContent(/^All changes saved at/);

	await user.type(notes(), "c");
	await user.click(discardButton());
	await elapse(saveInterval * 2);
	expect(saveStatus()).toHaveTextContent("Unsaved changes.");
	expect(sentTexts()).toEqual(["a", "ab"]);

	// After a quiet second the next edit saves at once; the one after it waits.
	await user.type(notes(), "d");
	await elapse(400);
	await user.type(notes(), "e");
	expect(saveStatus()).toHaveTextContent("Save waiting…");
	await user.click(screen.getByRole("button", { name: "Test back" }));
	expect(sentTexts()).toEqual(["a", "ab", "abcd", "abcde"]);
	await elapse(saveInterval * 2);
	expect(sentTexts()).toEqual(["a", "ab", "abcd", "abcde"]);
});

it("discards an edit queued behind a running save", async () => {
	const { user } = renderPacer();
	// "a" saves at once; "b" arrives while it runs and queues behind it.
	await user.type(notes(), "a");
	await user.type(notes(), "b");
	expect(saveStatus()).toHaveTextContent("Saving… Newer edits are waiting.");
	expect(screen.getByRole("button", { name: "Save now" })).toBeDisabled();
	await user.click(discardButton());
	expect(saveStatus()).toHaveTextContent(/^Saving…$/);
	await elapse(saveInterval * 3);
	expect(sentTexts()).toEqual(["a"]);
	expect(server.stored).toEqual(["a"]);
	expect(saveStatus()).toHaveTextContent("Unsaved changes.");
	expect(discardButton()).toBeDisabled();

	// The same holds behind a save that waited for the interval.
	await user.type(notes(), "c");
	await saveSettles();
	await user.type(notes(), "d");
	expect(saveStatus()).toHaveTextContent("Save waiting…");
	await elapse(saveInterval);
	await user.type(notes(), "e");
	expect(saveStatus()).toHaveTextContent("Saving… Newer edits are waiting.");
	expect(screen.getByRole("button", { name: "Save now" })).toBeDisabled();
	await user.click(discardButton());
	await elapse(saveInterval * 3);
	expect(sentTexts()).toEqual(["a", "abc", "abcd"]);
	expect(server.stored).toEqual(["a", "abc", "abcd"]);
	expect(server.maxInFlight).toBe(1);
	expect(notes()).toHaveValue("abcde");
	expect(saveStatus()).toHaveTextContent("Unsaved changes.");
});

it("keeps the note when saves fail, and saves it on retry", async () => {
	const { user } = renderPacer();
	const failing = () =>
		screen.getByRole("checkbox", { name: "Simulate a failing server" });
	await user.click(failing());
	await user.type(notes(), "a");
	await saveSettles();
	expect(screen.getByRole("alert")).toHaveTextContent(
		"The demo server is unavailable.",
	);
	expect(saveStatus()).toHaveTextContent("Unsaved changes.");

	// Later edits keep saving on schedule while the server fails.
	await user.type(notes(), "b");
	expect(saveStatus()).toHaveTextContent("Save waiting…");
	await elapse(saveInterval);
	await saveSettles();
	expect(sentTexts()).toEqual(["a", "ab"]);
	expect(screen.getByRole("alert")).toBeInTheDocument();

	await user.click(failing());
	await user.click(screen.getByRole("button", { name: "Try again" }));
	expect(saveStatus()).toHaveTextContent(/^Saving…$/);
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	expect(notes()).toHaveFocus();
	await saveSettles();
	expect(sentTexts()).toEqual(["a", "ab", "ab"]);
	expect(server.stored).toEqual(["ab"]);
	expect(saveStatus()).toHaveTextContent(/^All changes saved at/);
	expect(screen.getByText("2 edits · 1 save")).toBeInTheDocument();
});
