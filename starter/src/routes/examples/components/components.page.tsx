import { CollectionsSection } from "./lib/collections-section";
import { DisplaySection } from "./lib/display-section";
import { InputsSection } from "./lib/inputs-section";
import { NavigationSection } from "./lib/navigation-section";
import { OverlaysSection } from "./lib/overlays-section";
import { SelectionSection } from "./lib/selection-section";

const sections = [
	["#inputs", "Inputs"],
	["#selection", "Selection"],
	["#overlays", "Overlays"],
	["#navigation", "Navigation"],
	["#display", "Display"],
	["#collections", "Collections"],
] as const;

export function ComponentsPage() {
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
