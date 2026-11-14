import type { Ref } from "react";

/** A view: renders what it is given and says what the user did. No hooks into the app. */
export function DetailsToggleView({
	open,
	onToggle,
	ref,
}: {
	open: boolean;
	onToggle(trigger: HTMLElement): void;
	ref: Ref<HTMLButtonElement>;
}) {
	return (
		<button
			aria-pressed={open}
			onClick={(event) => onToggle(event.currentTarget)}
			ref={ref}
			type="button"
		>
			Details
		</button>
	);
}
