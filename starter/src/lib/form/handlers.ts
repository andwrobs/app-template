import type { FormEvent } from "react";
import type { Key } from "react-aria-components";

// Handlers the field and form components bind by reference.

// Select reports a key, or null when cleared; the field stores a string.
export function useSelectChange(field: { handleChange(value: string): void }) {
	return (key: Key | null) =>
		field.handleChange(key === null ? "" : String(key));
}

export function useFormSubmit(form: {
	state: { isSubmitting: boolean };
	handleSubmit(): Promise<unknown>;
}) {
	return (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		event.stopPropagation();
		// TanStack Form starts another submission if asked while one runs.
		if (form.state.isSubmitting) return;
		// A rejected submit belongs to the submission owner (a Query mutation or
		// fetcher), which renders the failure.
		form.handleSubmit().catch(() => undefined);
	};
}
