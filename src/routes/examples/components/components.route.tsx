import { pageTitle } from "~/lib/meta/title";
import type { Route } from "./+types/components.route";
import { CollectionsSection } from "./components/CollectionsSection";
import { DisplaySection } from "./components/DisplaySection";
import { InputsSection } from "./components/InputsSection";
import { NavigationSection } from "./components/NavigationSection";
import { OverlaysSection } from "./components/OverlaysSection";
import { SelectionSection } from "./components/SelectionSection";

const sections = [
	["#inputs", "Inputs"],
	["#selection", "Selection"],
	["#overlays", "Overlays"],
	["#navigation", "Navigation"],
	["#display", "Display"],
	["#collections", "Collections"],
] as const;

export const meta: Route.MetaFunction = () => [
	{ title: pageTitle("Components") },
];

export default function ComponentsRoute() {
	return (
		<main className="mx-auto w-full max-w-5xl space-y-12 px-4 py-12 sm:px-6">
			<div className="space-y-3">
				<p className="text-sm text-muted-foreground">
					Example 05 · React Aria + shadcn Nova
				</p>
				<h1 className="text-3xl font-semibold tracking-tight">
					Every component in src/lib/ui.
				</h1>
				<p className="max-w-2xl text-muted-foreground">
					Each demo is keyboard reachable and works in light and dark (use the
					moon toggle) and with reduced motion. Nothing here calls a server.
				</p>
				<nav aria-label="Component families" className="flex flex-wrap gap-3">
					{sections.map(([href, label]) => (
						<a
							key={href}
							href={href}
							className="text-sm underline-offset-4 hover:underline"
						>
							{label}
						</a>
					))}
				</nav>
			</div>
			<InputsSection />
			<SelectionSection />
			<OverlaysSection />
			<NavigationSection />
			<DisplaySection />
			<CollectionsSection />
		</main>
	);
}
