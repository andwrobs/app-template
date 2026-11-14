import { useSearchParams } from "react-router";
import { z } from "zod";

// What this page keeps in the URL's search params: the one place they are
// named, parsed and written.

const defaults = { order: "name" } as const;

const schema = z.object({
	/** A filter: changing it replaces the history entry. */
	order: z.enum(["name", "due"]).catch(defaults.order),
	/** A place: the task open in the preview. Opening it adds a history entry. */
	task: z.string().min(1).optional().catch(undefined),
});

export type ProjectSearch = z.infer<typeof schema>;

/** Never throws: a value the page doesn't know becomes its default. */
export function parseProjectSearch(params: URLSearchParams): ProjectSearch {
	return schema.parse(Object.fromEntries(params));
}

/** The next params: a default or missing value leaves the URL, so links stay short. */
function write(params: URLSearchParams, changes: Partial<ProjectSearch>) {
	const next = new URLSearchParams(params);
	for (const [name, value] of Object.entries(changes)) {
		const isDefault = value === defaults[name as keyof typeof defaults];
		if (value === undefined || isDefault) next.delete(name);
		else next.set(name, value);
	}
	return next;
}

export function useProjectSearch() {
	const [params, setParams] = useSearchParams();
	return {
		...parseProjectSearch(params),
		setOrder: (order: ProjectSearch["order"]) =>
			setParams(write(params, { order }), { replace: true }),
		openTask: (task: string) => setParams(write(params, { task })),
		closeTask: () => setParams(write(params, { task: undefined })),
	};
}
