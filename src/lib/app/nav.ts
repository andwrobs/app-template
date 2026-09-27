import {
	ComponentIcon,
	DatabaseIcon,
	HouseIcon,
	type LucideIcon,
	TableIcon,
	TextCursorInputIcon,
	TimerIcon,
} from "lucide-react";

// One list for the header and the sidebar. Keep each entry on one line.
export const navLinks: ReadonlyArray<
	readonly [to: string, label: string, icon: LucideIcon]
> = [
	["/", "Overview", HouseIcon],
	["/examples/query", "Query + Router", DatabaseIcon],
	["/examples/form", "Form", TextCursorInputIcon],
	["/examples/table", "Table", TableIcon],
	["/examples/pacer", "Pacer", TimerIcon],
	["/examples/components", "Components", ComponentIcon],
];

export function isCurrent(pathname: string, to: string) {
	return to === "/" ? pathname === "/" : pathname === to;
}
