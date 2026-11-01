import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderRoute } from "../../../test-utils/render-route";
import HomeRoute, { meta } from "./home.route";

it("renders the overview with the app's title", () => {
	renderRoute([{ path: "/", Component: HomeRoute, meta }]);
	expect(document.title).toBe("React Router SPA");
	expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
});
