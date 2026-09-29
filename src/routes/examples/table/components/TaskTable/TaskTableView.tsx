import { FlexRender } from "@tanstack/react-table";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	ChevronsUpDownIcon,
	Columns3Icon,
} from "lucide-react";
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
import { taskStatuses } from "../../tasks";
import { pageSizes } from "./table-url-state";
import type { TaskTableProps } from "./useTaskTable";

export function TaskTableView(props: TaskTableProps) {
	return (
		<>
			<div className="flex flex-wrap items-end gap-3">
				<TextField
					type="search"
					value={props.search}
					onChange={props.changeSearch}
					className="w-full sm:w-64"
				>
					<FieldLabel>Search</FieldLabel>
					<Input placeholder="ID or title" />
				</TextField>
				<Select
					value={props.status ?? "all"}
					onChange={props.changeStatus}
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
						selectedKeys={props.visibleColumns}
						onSelectionChange={props.changeVisibleColumns}
					>
						{props.hideableColumns.map((column) => (
							<DropdownMenuItem key={column.id} id={column.id}>
								{column.label}
							</DropdownMenuItem>
						))}
					</DropdownMenu>
				</DropdownMenuTrigger>
				<LinkButton href="/examples/table" variant="ghost">
					Reset view
				</LinkButton>
			</div>

			<div className="rounded-lg border">
				{/* Aria owns the grid semantics, keyboard, and selection gestures. */}
				<Table
					aria-label="Sample tasks"
					selectionMode="multiple"
					selectedKeys={props.pageSelection}
					onSelectionChange={props.changePageSelection}
					sortDescriptor={props.sort}
					onSortChange={props.changeSort}
				>
					<TableHeader>
						{props.headers.map((header) => (
							<TableHead
								key={header.id}
								id={header.column.id}
								isRowHeader={header.column.id === "title"}
								allowsSorting={header.column.getCanSort()}
							>
								{({ allowsSorting, sortDirection }) => (
									<span className="inline-flex items-center gap-1">
										<FlexRender header={header} />
										{allowsSorting && <SortIcon direction={sortDirection} />}
									</span>
								)}
							</TableHead>
						))}
					</TableHeader>
					<TableBody
						renderEmptyState={() => (
							<div className="space-y-3 px-4 py-8">
								{props.matchCount === 0 ? (
									<>
										<p>No tasks match this search and status.</p>
										<Button
											variant="outline"
											size="sm"
											onPress={props.clearSearchAndStatus}
										>
											Clear search and status
										</Button>
									</>
								) : (
									<>
										<p>Page {props.pageNumber} is past the last page.</p>
										<Button
											variant="outline"
											size="sm"
											onPress={props.firstPage}
										>
											Go to the first page
										</Button>
									</>
								)}
							</div>
						)}
					>
						{props.rows.map((row) => (
							<TableRow key={row.id} id={row.id}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										<FlexRender cell={cell} />
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
						Showing {props.firstShown}–{props.lastShown} of {props.matchCount}{" "}
						tasks · {props.selectedCount} selected
					</p>
					<Button
						variant="ghost"
						size="sm"
						isDisabled={props.selectedCount === 0}
						onPress={props.clearSelection}
					>
						Clear selection
					</Button>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Select
						aria-label="Rows per page"
						value={String(props.pageSize)}
						onChange={props.changePageSize}
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
						Page {props.pageNumber} of {props.pageCount}
					</span>
					<Button
						variant="outline"
						size="sm"
						isDisabled={!props.canPreviousPage}
						onPress={props.previousPage}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						isDisabled={!props.canNextPage}
						onPress={props.nextPage}
					>
						Next
					</Button>
				</div>
			</div>
		</>
	);
}

function SortIcon({ direction }: { direction?: "ascending" | "descending" }) {
	if (direction === "ascending") return <ArrowUpIcon aria-hidden />;
	if (direction === "descending") return <ArrowDownIcon aria-hidden />;
	return <ChevronsUpDownIcon aria-hidden className="text-muted-foreground" />;
}
