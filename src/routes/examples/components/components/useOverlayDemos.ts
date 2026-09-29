import { useState } from "react";
import { toast } from "sonner";

// The overlay demos' actions: the command palette's open state and the sample
// toasts. Nothing is saved or deleted.
export function useOverlayDemos() {
	const [commandOpen, setCommandOpen] = useState(false);
	return {
		commandOpen,
		setCommandOpen,
		openCommand: () => setCommandOpen(true),
		closeCommand: () => setCommandOpen(false),
		confirmDelete: () => toast.success("Sample deleted (not really)."),
		rename: () => toast("Renamed"),
		duplicate: () => toast("Duplicated"),
		copy: () => toast("Copied"),
		paste: () => toast("Pasted"),
		showSaved: () =>
			toast("Sample saved", {
				description: "Toasts announce through a live region.",
				action: { label: "Undo", onClick: () => toast("Undone") },
			}),
		showError: () => toast.error("The sample server is unavailable."),
	};
}
