import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { detailsOpen } from "~/lib/preferences/settings";
import { matchesMedia, subscribeToMedia } from "~/lib/ui/media-query";
import type { ArchiveIntent, SettledArchive } from "./archive/archive-flow";
import {
	createProjectStore,
	type ProjectDeps,
	ProjectFocus,
	ProjectStoreProvider,
} from "./project.store";

const dockedLayout = "(min-width: 1100px)";

// Stands in for a service call: `taskService.archive(intent)`.
declare function archiveTasks(intent: ArchiveIntent): Promise<readonly string[]>;

/** The store's composition root: every port is built here. */
function projectDeps(queryClient: QueryClient, projectId: string): ProjectDeps {
	return {
		newKey: () => crypto.randomUUID(),
		async sendArchive(intent): Promise<SettledArchive> {
			try {
				const archived = await archiveTasks(intent);
				return { status: "done", archived };
			} catch (failure) {
				return failure instanceof TypeError
					? { status: "uncertain" }
					: { status: "failed", reason: String(failure) };
			} finally {
				await queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
			}
		},
		dockedOpen: detailsOpen,
		layout: {
			docked: () => matchesMedia(dockedLayout),
			onDockedChange: (listener) => subscribeToMedia(dockedLayout, listener),
		},
	};
}

export function ProjectScreen({
	projectId,
	children,
}: {
	projectId: string;
	children: ReactNode;
}) {
	const queryClient = useQueryClient();
	return (
		<ProjectStoreProvider
			key={projectId}
			create={() => createProjectStore(projectDeps(queryClient, projectId))}
		>
			<ProjectFocus.Provider>{children}</ProjectFocus.Provider>
		</ProjectStoreProvider>
	);
}
