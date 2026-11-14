import { vi } from "vitest";

// These handler tests do not exercise cross-tab sign-out. Disable Node's
// BroadcastChannel so the shared browser service cannot keep the worker alive.
vi.stubGlobal("BroadcastChannel", undefined);
