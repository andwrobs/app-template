import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { SidebarProvider, useSidebar } from "~/lib/ui/sidebar";
import { useCloseMobileSidebar } from "./useCloseMobileSidebar";

afterEach(() => {
	vi.unstubAllGlobals();
});

function renderAtWidth(width: number) {
	vi.stubGlobal("innerWidth", width);
	vi.stubGlobal("matchMedia", (query: string) => ({
		matches: false,
		media: query,
		addEventListener: () => undefined,
		removeEventListener: () => undefined,
	}));
	const wrapper = ({ children }: { children: ReactNode }) => (
		<SidebarProvider>{children}</SidebarProvider>
	);
	return renderHook(
		() => ({ close: useCloseMobileSidebar(), sidebar: useSidebar() }),
		{ wrapper },
	);
}

it("closes the phone-width sheet", () => {
	const { result } = renderAtWidth(390);
	act(() => result.current.sidebar.setOpenMobile(true));

	act(() => result.current.close());

	expect(result.current.sidebar.openMobile).toBe(false);
});

it("leaves the desktop sidebar alone", () => {
	const { result } = renderAtWidth(1024);
	act(() => result.current.sidebar.setOpenMobile(true));

	act(() => result.current.close());

	expect(result.current.sidebar.openMobile).toBe(true);
});
