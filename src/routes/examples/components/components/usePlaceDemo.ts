import { useMemo, useState } from "react";

// The sample sidebar's current place, with one handler per place so each menu
// button binds its own by reference.
export function usePlaceDemo<Id extends string>(
	ids: readonly Id[],
	initial: Id,
) {
	const [place, setPlace] = useState(initial);
	const select = useMemo(
		() =>
			Object.fromEntries(ids.map((id) => [id, () => setPlace(id)])) as Record<
				Id,
				() => void
			>,
		[ids],
	);
	return { place, select };
}
