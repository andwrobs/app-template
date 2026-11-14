// Pure transitions for the details panel: a docked column on a wide screen,
// a drawer on a narrow one. Whether the docked column is open is a setting,
// so it isn't here.

export type DetailsState = {
	/** The screen is wide enough for the docked column. */
	docked: boolean;
	/** The drawer is open; meaningful only when not docked. */
	drawerOpen: boolean;
	/** Focus the panel owes: its heading after opening, the opener after closing. */
	focusRequest: "heading" | "return" | null;
};

export const initialDetails = (docked: boolean): DetailsState => ({
	docked,
	drawerOpen: false,
	focusRequest: null,
});

export const openDetails = (state: DetailsState): DetailsState => ({
	...state,
	drawerOpen: !state.docked,
	focusRequest: "heading",
});

export const closeDetails = (state: DetailsState): DetailsState => ({
	...state,
	drawerOpen: false,
	focusRequest: "return",
});

/** Crossing the breakpoint ends a drawer for good. */
export const changeLayout = (state: DetailsState, docked: boolean): DetailsState =>
	state.docked === docked ? state : { docked, drawerOpen: false, focusRequest: null };

export const focusClaimed = (state: DetailsState): DetailsState =>
	state.focusRequest ? { ...state, focusRequest: null } : state;
