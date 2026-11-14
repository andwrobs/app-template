import { expect, test, vi } from "vitest";
import type { SettledArchive } from "./lib/archive/archive-flow";
import { createProjectStore, type ProjectDeps } from "./project.store";

function build(overrides: Partial<ProjectDeps> = {}) {
	let open = false;
	const deps: ProjectDeps = {
		newKey: () => "key-1",
		sendArchive: vi.fn(async (): Promise<SettledArchive> => ({ status: "uncertain" })),
		dockedOpen: { get: () => open, set: (next) => void (open = next) },
		layout: { docked: () => true, onDockedChange: () => () => {} },
		...overrides,
	};
	return { store: createProjectStore(deps), deps };
}

test("a retry sends the same key, and archived tasks leave the selection", async () => {
	const sendArchive = vi
		.fn<ProjectDeps["sendArchive"]>()
		.mockResolvedValueOnce({ status: "uncertain" })
		.mockResolvedValueOnce({ status: "done", archived: ["a"] });
	const { store } = build({ sendArchive });
	const { selection, archive } = store.getState().actions;

	selection.replace(["a", "b"]);
	archive.start(["a"]);
	archive.confirm();
	await vi.waitFor(() =>
		expect(store.getState().archive.request.status).toBe("uncertain"),
	);
	archive.confirm();
	await vi.waitFor(() => expect(store.getState().archive.open).toBe(false));

	expect(sendArchive.mock.calls.map(([intent]) => intent.key)).toEqual(["key-1", "key-1"]);
	expect([...store.getState().selection.ids]).toEqual(["b"]);
});
