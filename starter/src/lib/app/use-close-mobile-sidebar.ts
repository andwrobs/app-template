import { useSidebar } from "~/lib/ui/sidebar";

// Choosing a page closes the phone-width sheet; the desktop sidebar stays open.
export function useCloseMobileSidebar() {
	const { isMobile, setOpenMobile } = useSidebar();
	return () => {
		if (isMobile) setOpenMobile(false);
	};
}
