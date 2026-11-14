import { useNavigation } from "react-router";
import { Button, LinkButton } from "~/lib/ui/button";
import type { Route } from "./+types/query.route";
import { useProjects } from "./lib/use-projects";

export function QueryPage({ loaderData }: Route.ComponentProps) {
	const { projects, isFetching, isError, refresh } = useProjects(
		loaderData.scenario,
	);
	const navigation = useNavigation();
	return (
		<main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-12 sm:px-6">
			<div className="space-y-2">
				<p className="text-sm text-muted-foreground">
					Example 01 · Query + Router
				</p>
				<h1 className="text-3xl font-semibold tracking-tight">
					A shared cache, ready on arrival.
				</h1>
				<p className="max-w-2xl text-muted-foreground">
					The route loads these synthetic projects before rendering. Navigating
					away and back within a minute reuses the cache. Reloading starts a new
					session.
				</p>
			</div>
			<nav aria-label="Example scenarios" className="flex flex-wrap gap-2">
				<LinkButton href="/examples/query" variant="outline">
					Sample projects
				</LinkButton>
				<LinkButton href="/examples/query?scenario=empty" variant="outline">
					Empty state
				</LinkButton>
				<LinkButton href="/examples/query?scenario=error" variant="outline">
					Error state
				</LinkButton>
			</nav>
			<p role="status" className="text-sm text-muted-foreground">
				{navigation.state !== "idle"
					? "Opening scenario…"
					: isFetching
						? "Refreshing projects…"
						: "Projects are up to date."}
			</p>
			{isError && (
				<p role="alert">
					Refresh failed. Previously loaded projects remain visible. Try
					refreshing again.
				</p>
			)}
			{projects?.length === 0 ? (
				<p>No sample projects in this view.</p>
			) : (
				<ul className="divide-y rounded-xl border">
					{projects?.map((project) => (
						<li
							key={project.id}
							className="flex flex-wrap justify-between gap-3 p-4"
						>
							<span className="font-medium">{project.name}</span>
							<span className="text-sm text-muted-foreground">
								{project.status}
							</span>
						</li>
					))}
				</ul>
			)}
			<Button isDisabled={isFetching} onPress={refresh}>
				Refresh projects
			</Button>
		</main>
	);
}

export function QueryErrorBoundary() {
	return (
		<main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-12 sm:px-6">
			<h1 className="text-3xl font-semibold">Projects could not load.</h1>
			<p role="alert">
				The example request failed. The Error state link triggers this
				deliberately; other failures may need a retry.
			</p>
			<LinkButton href="/examples/query">Return to sample projects</LinkButton>
		</main>
	);
}
