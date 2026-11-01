import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createQueryClient } from "~/lib/query/client";
import { useProjects } from "./useProjects";

const fetchMock = vi.fn();

beforeEach(() => {
	fetchMock
		.mockReset()
		.mockImplementation(async () =>
			Response.json([
				{ id: "studio", name: "Sample studio", status: "Active" },
			]),
		);
	vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

it("refreshes the scenario's projects", async () => {
	const client = createQueryClient();
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	);
	const { result } = renderHook(() => useProjects("default"), { wrapper });
	await waitFor(() => expect(result.current.projects).toHaveLength(1));

	result.current.refresh();
	await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
});
