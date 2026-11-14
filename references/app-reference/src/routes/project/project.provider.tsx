import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { classifyFailure } from "~/lib/api/api-error";
import { detailsOpen } from "~/lib/preferences/settings";
import { taskKeys } from "~/lib/tasks/tasks.queries";
import { matchesMedia, subscribeToMedia } from "~/lib/ui/media-query";
import { taskService } from "~/services";
import {
	createProjectStore,
	type ProjectDeps,
	ProjectFocus,
	ProjectStoreProvider,
} from "./project.store";

const dockedLayout = "(min-width: 1100px)";

/** Every port the store needs, built from the real services, cache, settings and browser. */
function projectDeps(queryClient: QueryClient, projectId: string): ProjectDeps {
	return {
		newKey: () => crypto.randomUUID(),
		async sendArchive(intent) {
			try {
				const { archived } = await taskService.archive(intent);
				return { status: "done", archived };
			} catch (error) {
				return classifyFailure(error);
			} finally {
				await queryClient.invalidateQueries({ queryKey: taskKeys.project(projectId) });
			}
		},
		dockedOpen: detailsOpen,
		layout: {
			docked: () => matchesMedia(dockedLayout),
			onDockedChange: (listener) => subscribeToMedia(dockedLayout, listener),
		},
	};
}

/**
 * The store's composition root. One store and one focus scope per project:
 * another project is another mount of everything inside.
 */
export function ProjectProvider({
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
