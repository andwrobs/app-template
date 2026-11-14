export const appName = "React Router SPA";

// "Form · React Router SPA" for a page, or the app name alone.
export function pageTitle(page?: string) {
	return page ? `${page} · ${appName}` : appName;
}
