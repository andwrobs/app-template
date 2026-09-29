import type {
	ColumnFiltersState,
	PaginationState,
	SortingState,
} from "@tanstack/react-table";
import { type TaskStatus, taskStatuses } from "../../tasks.query";

export const pageSizes = [10, 20, 50] as const;

const sortableColumns = new Set([
	"id",
	"title",
	"status",
	"priority",
	"estimate",
	"updated",
]);

// The view the URL keeps. Defaults stay out of the URL, and unknown values fall
// back to them, so a hand-edited link still opens.
export type TableUrlState = {
	q: string;
	status: TaskStatus | undefined;
	sort: { id: string; desc: boolean } | undefined;
	pageIndex: number;
	pageSize: number;
};

export function isTaskStatus(value: unknown): value is TaskStatus {
	return typeof value === "string" && Object.hasOwn(taskStatuses, value);
}

export function parseTableUrlState(search: URLSearchParams): TableUrlState {
	const sort = search.get("sort") ?? "";
	const sortId = sort.replace(/^-/, "");
	const page = Number(search.get("page"));
	const size = Number(search.get("size"));
	const status = search.get("status");
	return {
		q: search.get("q") ?? "",
		status: isTaskStatus(status) ? status : undefined,
		sort: sortableColumns.has(sortId)
			? { id: sortId, desc: sort.startsWith("-") }
			: undefined,
		pageIndex: Number.isInteger(page) && page > 1 ? page - 1 : 0,
		pageSize: (pageSizes as readonly number[]).includes(size)
			? size
			: pageSizes[0],
	};
}

// Any change other than paging returns to the first page.
export function writeTableUrlState(
	search: URLSearchParams,
	patch: Partial<TableUrlState>,
): URLSearchParams {
	const next = {
		...parseTableUrlState(search),
		...("pageIndex" in patch ? {} : { pageIndex: 0 }),
		...patch,
	};
	const params = new URLSearchParams(search);
	const set = (key: string, value: string | undefined) => {
		if (value) params.set(key, value);
		else params.delete(key);
	};
	set("q", next.q);
	set("status", next.status);
	set("sort", next.sort && `${next.sort.desc ? "-" : ""}${next.sort.id}`);
	set("page", next.pageIndex > 0 ? String(next.pageIndex + 1) : undefined);
	set(
		"size",
		next.pageSize === pageSizes[0] ? undefined : String(next.pageSize),
	);
	return params;
}

export function toTableState(url: TableUrlState): {
	sorting: SortingState;
	globalFilter: string;
	columnFilters: ColumnFiltersState;
	pagination: PaginationState;
} {
	return {
		sorting: url.sort ? [url.sort] : [],
		globalFilter: url.q,
		columnFilters: url.status ? [{ id: "status", value: url.status }] : [],
		pagination: { pageIndex: url.pageIndex, pageSize: url.pageSize },
	};
}
