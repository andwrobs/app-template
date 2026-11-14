import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type Question = { title: string; body: string; confirmLabel: string };

export type ConfirmState = { question: Question | null };

export type ConfirmActions = {
	actions: {
		/** Asks the user and waits. Resolves to their answer; a newer question answers this one "no". */
		ask(question: Question): Promise<boolean>;
		answer(yes: boolean): void;
	};
};

export const initialState: ConfirmState = { question: null };

/**
 * A question that work is waiting on. State holds what to show; the promise's
 * resolver stays private to the store. One dialog in the shell renders
 * `question` and calls `answer`.
 */
export const useConfirmStore = create<ConfirmState & ConfirmActions>()(
	devtools(
		(set) => {
			let resolve: ((yes: boolean) => void) | null = null;
			const settle = (yes: boolean) => {
				resolve?.(yes);
				resolve = null;
			};
			return {
				...initialState,
				actions: {
					ask(question) {
						settle(false);
						set({ question }, false, "ask");
						return new Promise<boolean>((resolver) => {
							resolve = resolver;
						});
					},
					answer(yes) {
						settle(yes);
						set({ question: null }, false, "answer");
					},
				},
			};
		},
		{ name: "app:confirm", enabled: import.meta.env.DEV },
	),
);

export const useQuestion = () => useConfirmStore((state) => state.question);
export const useConfirmActions = () => useConfirmStore((state) => state.actions);
/** A port for route stores: `confirm: askToConfirm`. */
export const askToConfirm = (question: Question) =>
	useConfirmStore.getState().actions.ask(question);
