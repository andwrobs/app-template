import { useQuery } from "@tanstack/react-query";
import { functionalUpdate, useTable } from "@tanstack/react-table";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	ChevronsUpDownIcon,
	Columns3Icon,
} from "lucide-react";
import { useMemo } from "react";
import {
	type ShouldRevalidateFunctionArgs,
	useSearchParams,
} from "react-router";
import { pageTitle } from "~/lib/meta/title";
import { queryClient } from "~/lib/query/client";
import { Button, LinkButton } from "~/lib/ui/button";
import {
	DropdownMenu,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/lib/ui/dropdown-menu";
import { FieldLabel } from "~/lib/ui/field";
import { Input } from "~/lib/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/lib/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/lib/ui/table";
import { TextField } from "~/lib/ui/text-field";
import { typingState, useSearchDraft } from "~/lib/url-state/useSearchDraft";
import type { Route } from "./+types/table.route";
import {
	isTaskStatus,
	pageSizes,
	parseTableUrlState,
	type TableUrlState,
	toTableState,
	writeTableUrlState,
} from "./table-url-state";
import { columnLabels, taskColumns, taskFeatures } from "./task-columns";
import { type Task, taskStatuses, tasksQuery } from "./tasks.query";

export const meta: Route.MetaFunction = () => [
	{ title: pageTitle("Table example") },
];

export async function clientLoader() {
	await queryClient.fetchQuery(tasksQuery);
	return null;
}

// The view lives in the search params and the fixture doesn't depend on them,
// so a search-only change skips the loader.
export function shouldRevalidate({
	currentUrl,
	nextUrl,
	defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
	if (
		currentUrl.pathname === nextUrl.pathname &&
		currentUrl.search !== nextUrl.search
	) {
		return false;
	}
	return defaultShouldRevalidate;
}

const noTasks: Task[] = [];

export default function TableRoute() {
	const { data = noTasks } = useQuery(tasksQuery);
	const [searchParams, setSearchParams] = useSearchParams();
	const url = useMemo(() => parseTableUrlState(searchParams), [searchParams]);
	const state = useMemo(() => toTableState(url), [url]);

	const [searchDraft, setSearchDraft] = useSearchDraft(url.q);

	// Router owns the view; Table reads it from the URL and writes changes back.
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

	const pageRows = table.getRowModel().rows;
	const pageIds = pageRows.map((row) => row.id);
	const { rowSelection } = table.state;
	const selectedCount = Object.keys(rowSelection).length;
	const matchCount = table.getFilteredRowModel().rows.length;
	const { pageIndex, pageSize } = state.pagination;
	const firstShown = pageRows.length ? pageIndex * pageSize + 1 : 0;
	const lastShown = pageRows.length ? firstShown + pageRows.length - 1 : 0;
	const hideableColumns = table
		.getAllLeafColumns()
		.filter((column) => column.getCanHide());

	return (
		<main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-12 sm:px-6">
			<div className="space-y-2">
				<p className="text-sm text-muted-foreground">
					Example 03 · TanStack Table + Aria table
				</p>
				<h1 className="text-3xl font-semibold tracking-tight">
					Sort, filter, and select sample tasks.
				</h1>
				<p className="max-w-2xl text-muted-foreground">
					Search, status, sort, and page live in the URL, so reload, Back, and
					shared links keep the view. Selection and visible columns stay on this
					page.
				</p>
			</div>

			<div className="flex flex-wrap items-end gap-3">
				<TextField
					type="search"
					value={searchDraft}
					onChange={(value) => {
						setSearchDraft(value);
						table.setGlobalFilter(value);
					}}
					className="w-full sm:w-64"
				>
					<FieldLabel>Search</FieldLabel>
					<Input placeholder="ID or title" />
				</TextField>
				<Select
					value={url.status ?? "all"}
					onChange={(key) =>
						table
							.getColumn("status")
							?.setFilterValue(key === "all" ? undefined : key)
					}
					className="flex w-40 flex-col gap-2"
				>
					<FieldLabel>Status</FieldLabel>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem id="all">All statuses</SelectItem>
						{Object.entries(taskStatuses).map(([value, label]) => (
							<SelectItem key={value} id={value}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<DropdownMenuTrigger>
					<Button variant="outline">
						<Columns3Icon data-icon="inline-start" />
						Columns
					</Button>
					<DropdownMenu
						placement="bottom end"
						className="w-44"
						selectionMode="multiple"
						selectedKeys={hideableColumns
							.filter((column) => column.getIsVisible())
							.map((column) => column.id)}
						onSelectionChange={(keys) =>
							table.setColumnVisibility(
								Object.fromEntries(
									hideableColumns.map((column) => [
										column.id,
										keys === "all" || keys.has(column.id),
									]),
								),
							)
						}
					>
						{hideableColumns.map((column) => (
							<DropdownMenuItem key={column.id} id={column.id}>
								{columnLabels[column.id]}
							</DropdownMenuItem>
						))}
					</DropdownMenu>
				</DropdownMenuTrigger>
				<LinkButton href="/examples/table" variant="ghost">
					Reset view
				</LinkButton>
			</div>

			<div className="rounded-lg border">
				{/* Aria owns the grid semantics, keyboard, and selection interaction.
				    Table owns the state: Aria gets this page's selection and the
				    sort, and reports changes back. */}
				<Table
					aria-label="Sample tasks"
					selectionMode="multiple"
					selectedKeys={pageIds.filter((id) => rowSelection[id])}
					onSelectionChange={(keys) =>
						table.setRowSelection((current) => {
							const next = { ...current };
							for (const id of pageIds) {
								if (keys === "all" || keys.has(id)) next[id] = true;
								else delete next[id];
							}
							return next;
						})
					}
					sortDescriptor={
						url.sort && {
							column: url.sort.id,
							direction: url.sort.desc ? "descending" : "ascending",
						}
					}
					onSortChange={({ column, direction }) =>
						table.setSorting([
							{ id: String(column), desc: direction === "descending" },
						])
					}
				>
					<TableHeader>
						{table.getHeaderGroups()[0]?.headers.map((header) => (
							<TableHead
								key={header.id}
								id={header.column.id}
								isRowHeader={header.column.id === "title"}
								allowsSorting={header.column.getCanSort()}
							>
								{({ allowsSorting, sortDirection }) => (
									<span className="inline-flex items-center gap-1">
										<table.FlexRender header={header} />
										{allowsSorting && <SortIcon direction={sortDirection} />}
									</span>
								)}
							</TableHead>
						))}
					</TableHeader>
					<TableBody
						renderEmptyState={() => (
							<div className="space-y-3 px-4 py-8">
								{matchCount === 0 ? (
									<>
										<p>No tasks match this search and status.</p>
										<Button
											variant="outline"
											size="sm"
											onPress={() => updateUrl({ q: "", status: undefined })}
										>
											Clear search and status
										</Button>
									</>
								) : (
									<>
										<p>Page {pageIndex + 1} is past the last page.</p>
										<Button
											variant="outline"
											size="sm"
											onPress={() => table.firstPage()}
										>
											Go to the first page
										</Button>
									</>
								)}
							</div>
						)}
					>
						{pageRows.map((row) => (
							<TableRow key={row.id} id={row.id}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										<table.FlexRender cell={cell} />
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3 text-sm">
				<div className="flex flex-wrap items-center gap-3">
					<p role="status" className="text-muted-foreground">
						Showing {firstShown}–{lastShown} of {matchCount} tasks ·{" "}
						{selectedCount} selected
					</p>
					<Button
						variant="ghost"
						size="sm"
						isDisabled={selectedCount === 0}
						onPress={() => table.resetRowSelection(true)}
					>
						Clear selection
					</Button>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Select
						aria-label="Rows per page"
						value={String(pageSize)}
						onChange={(key) => table.setPageSize(Number(key))}
					>
						<SelectTrigger size="sm">
							<SelectValue>
								{({ defaultChildren }) => <>{defaultChildren} per page</>}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{pageSizes.map((size) => (
								<SelectItem key={size} id={String(size)}>
									{String(size)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<span className="tabular-nums">
						Page {pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
					</span>
					<Button
						variant="outline"
						size="sm"
						isDisabled={!table.getCanPreviousPage()}
						onPress={() => table.previousPage()}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						isDisabled={!table.getCanNextPage()}
						onPress={() => table.nextPage()}
					>
						Next
					</Button>
				</div>
			</div>
		</main>
	);
}

function SortIcon({ direction }: { direction?: "ascending" | "descending" }) {
	if (direction === "ascending") return <ArrowUpIcon aria-hidden />;
	if (direction === "descending") return <ArrowDownIcon aria-hidden />;
	return <ChevronsUpDownIcon aria-hidden className="text-muted-foreground" />;
}

export function ErrorBoundary() {
	return (
		<main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-12 sm:px-6">
			<h1 className="text-3xl font-semibold">Tasks could not load.</h1>
			<p role="alert">The sample tasks request failed. Try again.</p>
			<LinkButton href="/examples/table">Reload the tasks</LinkButton>
		</main>
	);
}
