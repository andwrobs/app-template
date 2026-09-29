import { useQuery } from "@tanstack/react-query";
import { functionalUpdate, useTable } from "@tanstack/react-table";
import { useMemo } from "react";
import type { Key, Selection, SortDescriptor } from "react-aria-components";
import { useSearchParams } from "react-router";
import { typingState, useSearchDraft } from "~/lib/url-state/useSearchDraft";
import { type Task, tasksQuery } from "../../tasks.query";
import {
	isTaskStatus,
	parseTableUrlState,
	type TableUrlState,
	toTableState,
	writeTableUrlState,
} from "./table-url-state";
import { columnLabels, taskColumns, taskFeatures } from "./task-columns";

const noTasks: Task[] = [];

// Owns the task table. Query owns the rows and Router owns the view (search,
// status, sort, page); Table reads the view from the URL and writes changes
// back. Selection and visible columns stay in Table. Aria reports changes in
// its own formats, and the actions below translate them.
export function useTaskTable() {
	const { data = noTasks } = useQuery(tasksQuery);
	const [searchParams, setSearchParams] = useSearchParams();
	const url = useMemo(() => parseTableUrlState(searchParams), [searchParams]);
	const state = useMemo(() => toTableState(url), [url]);

	const [searchDraft, setSearchDraft] = useSearchDraft(url.q);

	// Typing replaces the history entry; other changes push one, so Back undoes
	// them.
	const updateUrl = (patch: Partial<TableUrlState>, typing = false) =>
		setSearchParams(
			(current) => writeTableUrlState(current, patch),
			typing ? { replace: true, state: typingState } : undefined,
		);

	const table = useTable({
		features: taskFeatures,
		columns: taskColumns,
		data,
		getRowId: (task) => task.id,
		globalFilterFn: "includesString",
		getColumnCanGlobalFilter: (column) =>
			column.id === "id" || column.id === "title",
		enableMultiSort: false,
		enableSortingRemoval: false,
		autoResetPageIndex: false,
		state,
		onSortingChange: (updater) =>
			updateUrl({ sort: functionalUpdate(updater, state.sorting)[0] }),
		onGlobalFilterChange: (updater) =>
			updateUrl(
				{ q: String(functionalUpdate(updater, state.globalFilter) ?? "") },
				true,
			),
		onColumnFiltersChange: (updater) => {
			const status = functionalUpdate(updater, state.columnFilters).find(
				(filter) => filter.id === "status",
			)?.value;
			updateUrl({ status: isTaskStatus(status) ? status : undefined });
		},
		onPaginationChange: (updater) =>
			updateUrl(functionalUpdate(updater, state.pagination)),
	});

	const rows = table.getRowModel().rows;
	const pageIds = rows.map((row) => row.id);
	const { rowSelection } = table.state;
	const { pageIndex, pageSize } = state.pagination;
	const firstShown = rows.length ? pageIndex * pageSize + 1 : 0;
	const hideableColumns = table
		.getAllLeafColumns()
		.filter((column) => column.getCanHide());
	const sort: SortDescriptor | undefined = url.sort && {
		column: url.sort.id,
		direction: url.sort.desc ? "descending" : "ascending",
	};

	return {
		// Rendering bindings: the header row and this page's rows.
		headers: table.getHeaderGroups()[0]?.headers ?? [],
		rows,
		search: searchDraft,
		status: url.status,
		sort,
		// Aria sees only the rendered page, so it gets that page's selection.
		pageSelection: pageIds.filter((id) => rowSelection[id]),
		hideableColumns: hideableColumns.map((column) => ({
			id: column.id,
			label: columnLabels[column.id],
		})),
		visibleColumns: hideableColumns
			.filter((column) => column.getIsVisible())
			.map((column) => column.id),
		selectedCount: Object.keys(rowSelection).length,
		matchCount: table.getFilteredRowModel().rows.length,
		firstShown,
		lastShown: rows.length ? firstShown + rows.length - 1 : 0,
		pageNumber: pageIndex + 1,
		pageCount: Math.max(table.getPageCount(), 1),
		pageSize,
		canPreviousPage: table.getCanPreviousPage(),
		canNextPage: table.getCanNextPage(),

		// The box shows the draft at once; the URL entry is replaced as you type.
		changeSearch: (value: string) => {
			setSearchDraft(value);
			table.setGlobalFilter(value);
		},
		changeStatus: (key: Key | null) =>
			table
				.getColumn("status")
				?.setFilterValue(isTaskStatus(key) ? key : undefined),
		changeSort: ({ column, direction }: SortDescriptor) =>
			table.setSorting([
				{ id: String(column), desc: direction === "descending" },
			]),
		// Merges this page's selection by row ID, keeping other pages' rows.
		changePageSelection: (keys: Selection) =>
			table.setRowSelection((current) => {
				const next = { ...current };
				for (const id of pageIds) {
					if (keys === "all" || keys.has(id)) next[id] = true;
					else delete next[id];
				}
				return next;
			}),
		changeVisibleColumns: (keys: Selection) =>
			table.setColumnVisibility(
				Object.fromEntries(
					hideableColumns.map((column) => [
						column.id,
						keys === "all" || keys.has(column.id),
					]),
				),
			),
		changePageSize: (key: Key | null) => table.setPageSize(Number(key)),
		clearSearchAndStatus: () => updateUrl({ q: "", status: undefined }),
		clearSelection: () => table.resetRowSelection(true),
		firstPage: () => table.firstPage(),
		previousPage: () => table.previousPage(),
		nextPage: () => table.nextPage(),
	};
}

export type TaskTableProps = ReturnType<typeof useTaskTable>;
