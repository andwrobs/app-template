import {
	columnFilteringFeature,
	columnVisibilityFeature,
	createColumnHelper,
	createFilteredRowModel,
	createPaginatedRowModel,
	createSortedRowModel,
	filterFn_equalsString,
	filterFn_includesString,
	globalFilteringFeature,
	rowPaginationFeature,
	rowSelectionFeature,
	rowSortingFeature,
	sortFn_alphanumeric,
	sortFn_text,
	tableFeatures,
} from "@tanstack/react-table";
import { Badge } from "~/lib/ui/badge";
import { Checkbox } from "~/lib/ui/checkbox";
import { type Task, taskStatuses } from "./tasks.query";

// v9 registers only the features this table uses.
export const taskFeatures = tableFeatures({
	columnFilteringFeature,
	globalFilteringFeature,
	columnVisibilityFeature,
	rowSortingFeature,
	rowPaginationFeature,
	rowSelectionFeature,
	filteredRowModel: createFilteredRowModel(),
	sortedRowModel: createSortedRowModel(),
	paginatedRowModel: createPaginatedRowModel(),
	filterFns: {
		includesString: filterFn_includesString,
		equalsString: filterFn_equalsString,
	},
	sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

const helper = createColumnHelper<typeof taskFeatures, Task>();

const priorityRank = { low: 0, medium: 1, high: 2 } as const;

const statusBadge = {
	todo: "outline",
	"in-progress": "secondary",
	done: "default",
	canceled: "ghost",
} as const;

const dateFormat = new Intl.DateTimeFormat("en", {
	month: "short",
	day: "numeric",
	year: "numeric",
	timeZone: "UTC",
});

export const columnLabels: Record<string, string> = {
	id: "ID",
	title: "Title",
	status: "Status",
	priority: "Priority",
	estimate: "Points",
	updated: "Updated",
};

export const taskColumns = helper.columns([
	// Aria's Table fills slot="selection" checkboxes with select-all and row
	// selection, including their labels and the indeterminate state.
	helper.display({
		id: "select",
		header: () => <Checkbox slot="selection" />,
		cell: () => <Checkbox slot="selection" />,
		enableSorting: false,
		enableHiding: false,
	}),
	helper.accessor("id", { header: columnLabels.id, sortFn: "alphanumeric" }),
	helper.accessor("title", {
		header: columnLabels.title,
		sortFn: "text",
		enableHiding: false,
	}),
	helper.accessor("status", {
		header: columnLabels.status,
		sortFn: "text",
		filterFn: "equalsString",
		cell: ({ getValue }) => (
			<Badge variant={statusBadge[getValue()]}>
				{taskStatuses[getValue()]}
			</Badge>
		),
	}),
	helper.accessor("priority", {
		header: columnLabels.priority,
		// Comparators return ascending order; Table reverses for descending.
		sortFn: (a, b, id) =>
			priorityRank[a.getValue<Task["priority"]>(id)] -
			priorityRank[b.getValue<Task["priority"]>(id)],
		cell: ({ getValue }) => <span className="capitalize">{getValue()}</span>,
	}),
	helper.accessor("estimate", {
		header: columnLabels.estimate,
		cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
	}),
	helper.accessor("updated", {
		header: columnLabels.updated,
		sortFn: "alphanumeric",
		cell: ({ getValue }) =>
			dateFormat.format(new Date(`${getValue()}T00:00:00Z`)),
	}),
]);
