export interface NoteService {
	save(
		text: string,
		serverFails: boolean,
	): Promise<{ text: string; savedAt: number }>;
}

// Stands in for an API call. Nothing leaves the browser.
export function createDemoNoteService(): NoteService {
	async function save(text: string, serverFails: boolean) {
		await new Promise((resolve) => setTimeout(resolve, 400));
		if (serverFails) throw new Error("The demo server is unavailable.");
		return { text, savedAt: Date.now() };
	}

	return { save };
}
