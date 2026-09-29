import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { themeScript, useDarkTheme, useThemeStore } from "./theme";

const root = document.documentElement;
const runHeadScript = () => new Function(themeScript)();

beforeEach(() => {
	root.className = "";
	localStorage.clear();
});

afterEach(() => {
	vi.unstubAllGlobals();
});

it("applies, stores, and shares the chosen theme", () => {
	useThemeStore.getState().setTheme("dark");
	expect(root).toHaveClass("dark");
	expect(root.style.colorScheme).toBe("dark");
	expect(localStorage.getItem("theme")).toBe("dark");
	expect(useThemeStore.getState().theme).toBe("dark");

	useThemeStore.getState().setTheme("light");
	expect(root).not.toHaveClass("dark");
	expect(localStorage.getItem("theme")).toBe("light");
});

it("starts from the stored theme, else the system theme", () => {
	vi.stubGlobal("matchMedia", () => ({ matches: true }));
	runHeadScript();
	expect(root).toHaveClass("dark");

	localStorage.setItem("theme", "light");
	runHeadScript();
	expect(root).not.toHaveClass("dark");
});

it("switches to dark and back through the toggle's handler", () => {
	const { result } = renderHook(() => useDarkTheme());

	act(() => result.current.setDark(true));
	expect(result.current.isDark).toBe(true);
	expect(root).toHaveClass("dark");

	act(() => result.current.setDark(false));
	expect(result.current.isDark).toBe(false);
	expect(root).not.toHaveClass("dark");
});
