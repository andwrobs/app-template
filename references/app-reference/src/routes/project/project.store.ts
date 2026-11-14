import { devtools } from "zustand/middleware";
import { createStore, type StoreApi } from "zustand/vanilla";
import { createFocusScope } from "~/lib/focus/focus-scope";
import {
	createRouteStoreContext,
	sliceScopes,
	startAll,
} from "~/lib/route-store/route-store";
import { initialArchive } from "./lib/archive/archive-flow";
import {
	type ArchiveActions,
	type ArchiveDeps,
	type ArchiveState,
	createArchiveSlice,
} from "./lib/archive/archive.slice";
import { initialDetails } from "./lib/details/details-state";
import {
	createDetailsSlice,
	type DetailsActions,
	type DetailsDeps,
	type DetailsState,
} from "./lib/details/details.slice";
import {
	createSelectionSlice,
	initialSelection,
	type SelectionActions,
	type SelectionState,
} from "./lib/selection/selection.slice";

export type ProjectState = {
	selection: SelectionState;
	details: DetailsState;
	archive: ArchiveState;
};

export type ProjectActions = {
	selection: SelectionActions;
	details: DetailsActions;
	archive: ArchiveActions;
};

type Project = ProjectState & {
	actions: ProjectActions;
	start(): () => void;
};

/** What the screen needs from outside. `project.provider.tsx` builds it. */
export type ProjectDeps = Pick<DetailsDeps, "dockedOpen" | "layout"> &
	Pick<ArchiveDeps, "sendArchive" | "newKey">;

export function createProjectStore(deps: ProjectDeps): StoreApi<Project> {
	return createStore<Project>()(
		devtools(
			(set, get) => {
				const scope = sliceScopes<ProjectState>(set, get);
				const selection = createSelectionSlice(scope("selection"));
				const archive = createArchiveSlice(scope("archive"), {
					sendArchive: deps.sendArchive,
					newKey: deps.newKey,
					archived: selection.actions.remove,
				});
				const details = createDetailsSlice(scope("details"), {
					dockedOpen: deps.dockedOpen,
					layout: deps.layout,
					startArchive: archive.actions.start,
				});
				return {
					selection: initialSelection,
					details: initialDetails(deps.layout.docked()),
					archive: initialArchive,
					actions: {
						selection: selection.actions,
						details: details.actions,
						archive: archive.actions,
					},
					start: startAll(selection, details, archive),
				};
			},
			{ name: "app:project", enabled: import.meta.env.DEV },
		),
	);
}

export const {
	Provider: ProjectStoreProvider,
	useStore: useProjectStore,
	useActions: useProjectActions,
} = createRouteStoreContext<Project>("Project");

/** The focus targets the screen's capabilities share. */
export const ProjectFocus = createFocusScope<"detailsOpener" | "detailsToggle">();
