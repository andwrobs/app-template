import type { QueryClient } from "@tanstack/react-query";
import { setViewer } from "~/lib/preferences/viewer-storage";
import { sessionService } from "~/services";
import { sessionOptions } from "./session.queries";
import { announceSignOut, goToSignIn } from "./sign-in-redirect";

/** The session, loading it once. Tells browser storage whose it is. */
export async function requireSession(queryClient: QueryClient) {
	const session = await queryClient.ensureQueryData(sessionOptions());
	setViewer(session.viewerId);
	return session;
}

export async function signOut() {
	await sessionService.signOut();
	announceSignOut();
	goToSignIn();
}
