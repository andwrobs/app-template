import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderRoute } from "../../../test-utils/render-route";
import HomePage, { meta } from "./home.route";

it("renders the overview with the app's title", () => {
	renderRoute([{ path: "/", Component: HomePage, meta }]);
	expect(document.title).toBe("React Router SPA");
	expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
});
