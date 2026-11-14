import { useEffect } from "react";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type PageCommand = { id: string; label: string; run(): void };

export type PageCommandsState = { commands: readonly PageCommand[] };

export type PageCommandsActions = {
	actions: {
		/** Offers these commands while the caller is on screen; returns the function that withdraws them. */
		register(commands: readonly PageCommand[]): () => void;
	};
};

export const initialState: PageCommandsState = { commands: [] };

export const usePageCommandsStore = create<PageCommandsState & PageCommandsActions>()(
	devtools(
		(set) => ({
			...initialState,
			actions: {
				register(commands) {
					set((state) => ({ commands: [...state.commands, ...commands] }), false, "register");
					return () =>
						set(
							(state) => ({
								commands: state.commands.filter((command) => !commands.includes(command)),
							}),
							false,
							"withdraw",
						);
				},
			},
		}),
		{ name: "app:page-commands", enabled: import.meta.env.DEV },
	),
);

/**
 * How a screen contributes to the shell: it registers while mounted and the
 * effect's cleanup withdraws. The shell never imports the screen. Pass a
 * stable array.
 */
export function usePageCommands(commands: readonly PageCommand[]) {
	const register = usePageCommandsStore((state) => state.actions.register);
	useEffect(() => register(commands), [register, commands]);
}
