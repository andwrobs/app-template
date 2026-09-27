import type { ReactNode } from "react";
import { cn } from "~/lib/ui/utils";

export function Section({
	id,
	title,
	description,
	children,
}: {
	id: string;
	title: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<section
			id={id}
			aria-labelledby={`${id}-heading`}
			className="scroll-mt-6 space-y-4"
		>
			<div className="space-y-1">
				<h2 id={`${id}-heading`} className="text-xl font-semibold">
					{title}
				</h2>
				<p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
			</div>
			<div className="grid gap-4 md:grid-cols-2">{children}</div>
		</section>
	);
}

export function Demo({
	title,
	className,
	children,
}: {
	title: string;
	className?: string;
	children: ReactNode;
}) {
	return (
		<div className="min-w-0 space-y-3 rounded-xl border p-4">
			<h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
			<div className={cn("flex flex-wrap items-start gap-3", className)}>
				{children}
			</div>
		</div>
	);
}
