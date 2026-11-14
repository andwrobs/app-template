import { ArrowUpRightIcon } from "lucide-react";
import { pageTitle } from "~/lib/meta/title";
import { LinkButton } from "~/lib/ui/button";
import type { Route } from "./+types/home.route";

const examples: ReadonlyArray<readonly [href: string, label: string]> = [
	["/examples/query", "Query + Router"],
	["/examples/form", "TanStack Form"],
	["/examples/table", "TanStack Table"],
	["/examples/pacer", "TanStack Pacer"],
	["/examples/components", "Components"],
];

export const meta: Route.MetaFunction = () => [{ title: pageTitle() }];

export default function HomeRoute() {
	return (
		<main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-16 sm:px-6">
			<section className="max-w-2xl space-y-6">
				<p className="text-sm font-medium text-muted-foreground">
					React Router 8 · Framework Mode · SPA only
				</p>
				<div className="space-y-3">
					<h1 className="text-4xl font-semibold tracking-tight text-balance">
						Build accessible interfaces with shadcn/ui and React Aria.
					</h1>
					<p className="max-w-xl text-base text-muted-foreground">
						This starter is configured with the shadcn Aria registry, semantic
						theme tokens, and local components you can customize.
					</p>
				</div>
				{examples.length > 0 && (
					<nav aria-label="Examples" className="flex flex-wrap gap-2">
						{examples.map(([href, label]) => (
							<LinkButton key={href} href={href} variant="outline">
								{label}
							</LinkButton>
						))}
					</nav>
				)}
				<LinkButton
					href="https://ui.shadcn.com/docs/components/aria"
					target="_blank"
					rel="noreferrer"
				>
					Explore Aria components
					<ArrowUpRightIcon data-icon="inline-end" />
				</LinkButton>
			</section>
		</main>
	);
}
