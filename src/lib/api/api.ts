import type { z } from "zod";

export type ApiErrorKind = "network" | "http" | "invalid-response";

// One error type for every failed request. `kind` says what went wrong;
// `status` and `body` carry what the server sent, when it answered.
export class ApiError extends Error {
	override name = "ApiError";

	constructor(
		readonly kind: ApiErrorKind,
		message: string,
		readonly url: string,
		readonly status?: number,
		readonly body?: unknown,
		options?: ErrorOptions,
	) {
		super(message, options);
	}
}

export type JsonInit = Omit<RequestInit, "body"> & { json?: unknown };

/**
 * Fetches JSON and parses it with a Zod schema. Aborts pass through unchanged
 * so Query can cancel; anything else becomes an ApiError.
 */
export async function fetchJson<T>(
	url: string,
	schema: z.ZodType<T>,
	{ json, headers, ...init }: JsonInit = {},
): Promise<T> {
	const requestHeaders = new Headers(headers);
	if (!requestHeaders.has("Accept")) {
		requestHeaders.set("Accept", "application/json");
	}
	if (json !== undefined && !requestHeaders.has("Content-Type")) {
		requestHeaders.set("Content-Type", "application/json");
	}

	let response: Response;
	let body: unknown;
	try {
		response = await fetch(url, {
			...init,
			headers: requestHeaders,
			body: json === undefined ? undefined : JSON.stringify(json),
		});
		body = await readBody(response);
	} catch (error) {
		if (isAbort(error)) throw error;
		throw new ApiError(
			"network",
			"The server couldn't be reached.",
			url,
			undefined,
			undefined,
			{ cause: error },
		);
	}

	if (!response.ok) {
		throw new ApiError(
			"http",
			`Request failed (${response.status}).`,
			url,
			response.status,
			body,
		);
	}
	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		throw new ApiError(
			"invalid-response",
			"The server sent an unexpected response.",
			url,
			response.status,
			body,
			{ cause: parsed.error },
		);
	}
	return parsed.data;
}

export interface ApiClient {
	/** Fetches `path` from the client's base URL and parses it with `schema`. */
	request<T>(path: string, schema: z.ZodType<T>, init?: JsonInit): Promise<T>;
}

type Deps = { baseUrl: string };

// Services take a client instead of reading VITE_API_URL, so the composition
// root decides where each one sends requests.
export function createApiClient({ baseUrl }: Deps): ApiClient {
	function request<T>(path: string, schema: z.ZodType<T>, init?: JsonInit) {
		return fetchJson(apiUrl(path, baseUrl), schema, init);
	}

	return { request };
}

export function apiUrl(path: string, base: string) {
	return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function readBody(response: Response): Promise<unknown> {
	const text = await response.text();
	if (!text) return undefined;
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

// DOMException isn't an Error subclass everywhere, so check the name.
function isAbort(error: unknown) {
	return (error as { name?: unknown } | null)?.name === "AbortError";
}
