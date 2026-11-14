import { expect, it, vi } from "vitest";
import type { ApiClient } from "~/lib/api/api";
import { createProjectsService } from "./projects.service";

const projects = [{ id: "studio", name: "Sample studio", status: "Active" }];

function setup() {
	const api: ApiClient = { request: vi.fn().mockResolvedValue(projects) };
	return { api, service: createProjectsService({ api }) };
}

it("lists projects, passing the caller's signal to the client", async () => {
	const { api, service } = setup();
	const signal = new AbortController().signal;
	await expect(service.list("default", { signal })).resolves.toEqual(projects);
	expect(api.request).toHaveBeenCalledWith("projects.json", expect.anything(), {
		signal,
	});
});

it("answers the empty and error scenarios", async () => {
	const { api, service } = setup();
	await expect(service.list("empty")).resolves.toEqual([]);
	await expect(service.list("error")).rejects.toThrow("demonstration error");
	expect(api.request).toHaveBeenCalledTimes(1);
});
