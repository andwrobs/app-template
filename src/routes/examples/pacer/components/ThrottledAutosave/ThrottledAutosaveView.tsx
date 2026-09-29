import type { RefObject } from "react";
import { Button } from "~/lib/ui/button";
import { CheckboxButton, CheckboxField } from "~/lib/ui/checkbox";
import { FieldDescription, FieldLabel } from "~/lib/ui/field";
import { TextField } from "~/lib/ui/text-field";
import { Textarea } from "~/lib/ui/textarea";

export type ThrottledAutosaveProps = {
	text: string;
	saved: { text: string; savedAt: number } | undefined;
	saves: number;
	edits: number;
	isWaiting: boolean;
	isSaving: boolean;
	canSaveNow: boolean;
	error: string | undefined;
	serverFails: boolean;
	onChange: (value: string) => void;
	onSaveNow: () => void;
	onDiscard: () => void;
	onRetry: () => void;
	onServerFailsChange: (fails: boolean) => void;
	noteRef: RefObject<HTMLTextAreaElement | null>;
};

const timeFormat = new Intl.DateTimeFormat("en", { timeStyle: "medium" });

export function ThrottledAutosaveView(props: ThrottledAutosaveProps) {
	return (
		<section aria-labelledby="throttle-heading" className="space-y-4">
			<div className="space-y-1">
				<h2 id="throttle-heading" className="text-xl font-semibold">
					Throttle a mutation: autosave
				</h2>
				<p className="max-w-2xl text-sm text-muted-foreground">
					Saves run while you type, at most once a second and one at a time. The
					last edit always saves. Save now starts the waiting save once nothing
					else is saving. Discard drops it, even behind a running save, and
					leaves the note unsaved.
				</p>
			</div>
			<TextField
				value={props.text}
				onChange={props.onChange}
				className="max-w-xl"
			>
				<FieldLabel>Notes</FieldLabel>
				<Textarea
					ref={props.noteRef}
					placeholder="Type for a few seconds and watch the saves."
				/>
				<FieldDescription>
					Saved to a simulated server; nothing leaves the browser.
				</FieldDescription>
			</TextField>
			<div className="flex flex-wrap gap-2">
				<Button
					variant="outline"
					isDisabled={!props.canSaveNow}
					onPress={props.onSaveNow}
				>
					Save now
				</Button>
				<Button
					variant="ghost"
					isDisabled={!props.isWaiting}
					onPress={props.onDiscard}
				>
					Discard waiting save
				</Button>
			</div>
			<CheckboxField
				isSelected={props.serverFails}
				onChange={props.onServerFailsChange}
			>
				<CheckboxButton>Simulate a failing server</CheckboxButton>
			</CheckboxField>
			<p role="status" className="text-sm">
				<SaveStatus {...props} />
			</p>
			<p className="text-sm text-muted-foreground tabular-nums">
				{props.edits} {props.edits === 1 ? "edit" : "edits"} · {props.saves}{" "}
				{props.saves === 1 ? "save" : "saves"}
			</p>
			{props.error && (
				<div role="alert" className="space-y-2 text-sm">
					<p className="text-destructive">{props.error}</p>
					<p>Your note is still here. Keep typing, or try again.</p>
					<Button variant="outline" size="sm" onPress={props.onRetry}>
						Try again
					</Button>
				</div>
			)}
		</section>
	);
}

function SaveStatus({
	text,
	saved,
	isWaiting,
	isSaving,
}: ThrottledAutosaveProps) {
	if (isSaving) {
		return isWaiting ? "Saving… Newer edits are waiting." : "Saving…";
	}
	if (isWaiting) return "Save waiting…";
	if (text === (saved?.text ?? "")) {
		return saved
			? `All changes saved at ${timeFormat.format(saved.savedAt)}.`
			: "Nothing to save yet.";
	}
	return "Unsaved changes.";
}
