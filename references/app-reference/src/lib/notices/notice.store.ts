import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type Notice = { id: string; text: string };

export type NoticeState = { notices: readonly Notice[] };

export type NoticeActions = {
	actions: {
		/** Says something about work that finished away from where the user is looking. */
		notify(text: string): void;
		dismiss(id: string): void;
	};
};

export const initialState: NoticeState = { notices: [] };

const most = 3;

export const useNoticeStore = create<NoticeState & NoticeActions>()(
	devtools(
		(set) => ({
			...initialState,
			actions: {
				notify: (text) =>
					set(
						({ notices }) => ({
							notices: [...notices, { id: crypto.randomUUID(), text }].slice(-most),
						}),
						false,
						"notify",
					),
				dismiss: (id) =>
					set(
						({ notices }) => ({ notices: notices.filter((notice) => notice.id !== id) }),
						false,
						"dismiss",
					),
			},
		}),
		{ name: "app:notices", enabled: import.meta.env.DEV },
	),
);

export const useNotices = () => useNoticeStore((state) => state.notices);
export const useNoticeActions = () => useNoticeStore((state) => state.actions);
