import { useEffect, useRef, useState } from "react";

// The pending-state button: a press shows the pending state for 1.5 s.
export function usePendingDemo() {
	const [isPending, setIsPending] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
	useEffect(() => () => clearTimeout(timer.current), []);
	return {
		isPending,
		simulateSave: () => {
			setIsPending(true);
			clearTimeout(timer.current);
			timer.current = setTimeout(() => setIsPending(false), 1500);
		},
	};
}
