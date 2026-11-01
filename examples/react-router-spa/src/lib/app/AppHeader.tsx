import { NavLink } from "react-router";
import { navLinks } from "~/lib/app/nav";
import { ThemeToggle } from "~/lib/app/ThemeToggle";
import { appName } from "~/lib/meta/title";

export function AppHeader() {
	return (
		<header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
			<div className="mx-auto flex min-h-14 w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
				<NavLink to="/" className="font-semibold tracking-tight">
					{appName}
				</NavLink>
				<nav
					aria-label="Main navigation"
					className="flex flex-wrap gap-x-4 gap-y-1 text-sm"
				>
					{navLinks.map(([to, label]) => (
						<NavLink
							key={to}
							to={to}
							end
							className="underline-offset-4 hover:underline aria-[current=page]:font-medium aria-[current=page]:underline"
						>
							{label}
						</NavLink>
					))}
				</nav>
				<ThemeToggle />
			</div>
		</header>
	);
}
