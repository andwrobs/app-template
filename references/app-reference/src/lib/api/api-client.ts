import { ApiError } from "./api-error";

/**
 * Sends one request. Resolves to the reply's data or throws one `ApiError`;
 * an abort passes through. A generated client can replace this as long as it
 * keeps that contract.
 */
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	let response: Response;
	try {
		response = await fetch(path, {
			credentials: "same-origin",
			...init,
			headers: { "Content-Type": "application/json", ...init.headers },
		});
	} catch (cause) {
		if (init.signal?.aborted) throw cause;
		throw new ApiError("network", undefined, { cause });
	}
	if (!response.ok) throw new ApiError("http", response.status);
	if (response.status === 204) return undefined as T;
	try {
		return (await response.json()) as T;
	} catch (cause) {
		throw new ApiError("invalid-response", response.status, { cause });
	}
}

export type ApiClient = { request: typeof request };
