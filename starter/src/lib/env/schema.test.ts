import { expect, it } from "vitest";
import { parseEnv } from "./schema";

it("fills defaults and accepts paths and absolute URLs", () => {
	expect(parseEnv({})).toEqual({ VITE_API_URL: "/api" });
	expect(parseEnv({ VITE_API_URL: "https://api.example.test/v1" })).toEqual({
		VITE_API_URL: "https://api.example.test/v1",
	});
});

it("names the setting and the fix when a value is wrong", () => {
	expect(() => parseEnv({ VITE_API_URL: "ftp://files.example.test" })).toThrow(
		/VITE_API_URL: Use a path starting with \/ or an absolute http\(s\) URL\./,
	);
});
