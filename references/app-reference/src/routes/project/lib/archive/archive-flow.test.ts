import { expect, test } from "vitest";
import {
	type ArchiveState,
	confirmArchive,
	finishArchive,
	initialArchive,
	startArchive,
} from "./archive-flow";

const uncertain: ArchiveState = {
	...initialArchive,
	open: true,
	taskIds: ["a"],
	request: { status: "uncertain", intent: { key: "k1", taskIds: ["a"] } },
};

test("a retry repeats the same request under the same key", () => {
	expect(confirmArchive(uncertain, "k2")?.send).toEqual({ key: "k1", taskIds: ["a"] });
});

test("nothing starts while a request is being sent", () => {
	const sending = confirmArchive(uncertain, "k2")?.next ?? uncertain;
	expect(startArchive(sending, ["b"])).toBeUndefined();
});

test("a reply that is no longer awaited changes nothing on screen", () => {
	const finished = finishArchive(
		initialArchive,
		{ key: "k1", taskIds: ["a"] },
		{ status: "done", archived: ["a"] },
	);
	expect(finished.next).toBeUndefined();
	// The tasks are gone either way, so the selection still hears about it.
	expect(finished.archived).toEqual(["a"]);
});
