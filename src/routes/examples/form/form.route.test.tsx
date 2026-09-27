import { fireEvent, screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { renderRoute } from "../../../../test-utils/render-route";
import { submitProjectRequest } from "./demo-server";
import FormRoute, { meta } from "./form.route";

vi.mock("./demo-server", async (importOriginal) => ({
	...(await importOriginal<typeof import("./demo-server")>()),
	submitProjectRequest: vi.fn(),
}));
const submit = vi.mocked(submitProjectRequest);

beforeEach(() => {
	submit.mockReset().mockImplementation(async (request, scenario) => {
		if (scenario === "error")
			throw new Error("The demo server is unavailable.");
		return { id: "REQ-042", ...request };
	});
});

function renderForm(url = "/examples/form") {
	return renderRoute([{ path: "/examples/form", Component: FormRoute, meta }], {
		initialEntries: [url],
	});
}

const nameInput = () => screen.getByRole("textbox", { name: /project name/i });
const emailInput = () =>
	screen.getByRole("textbox", { name: /contact email/i });
const detailsInput = () =>
	screen.getByRole("textbox", { name: /project details/i });
const teamTrigger = () => screen.getByRole("button", { name: /team/i });
const confirmBox = () => screen.getByRole("checkbox", { name: /sample data/i });
const submitButton = () => screen.getByRole("button", { name: /submit/i });

async function fillValidForm(user: UserEvent) {
	await user.type(nameInput(), "  Sample dashboard  ");
	await user.type(emailInput(), "sam@example.com");
	await user.click(teamTrigger());
	await user.click(await screen.findByRole("option", { name: "Research" }));
	await user.type(detailsInput(), "A sample project for trying the form.");
	await user.click(confirmBox());
}

it("shows errors linked to their fields after blur or submit", async () => {
	const { user } = renderForm();
	expect(document.title).toBe("Form example · React Router SPA");
	await user.type(nameInput(), "ab");
	expect(nameInput()).not.toHaveAttribute("aria-invalid");

	await user.tab();
	expect(nameInput()).toHaveAttribute("aria-invalid", "true");
	expect(nameInput()).toHaveAccessibleDescription("Use at least 3 characters.");
	expect(emailInput()).not.toHaveAttribute("aria-invalid");

	await user.click(submitButton());
	expect(emailInput()).toHaveAccessibleDescription(
		"Enter an email address such as you@example.com.",
	);
	expect(teamTrigger()).toHaveAccessibleDescription("Choose a team.");
	expect(detailsInput()).toHaveAccessibleDescription(
		/20 to 500 characters.*Describe the project in at least 20 characters\./,
	);
	expect(confirmBox()).toHaveAccessibleDescription(
		"Confirm the request contains only sample data.",
	);
	expect(submit).not.toHaveBeenCalled();

	await user.type(nameInput(), "c");
	expect(nameInput()).not.toHaveAttribute("aria-invalid");
});

it("submits the parsed values once, then resets the form", async () => {
	let finish: () => void = () => undefined;
	submit.mockImplementation(
		(request) =>
			new Promise((resolve) => {
				finish = () => resolve({ id: "REQ-042", ...request });
			}),
	);
	const { user } = renderForm();
	await fillValidForm(user);

	await user.click(submitButton());
	// The pending button blocks clicks and Enter; the form blocks other submits.
	await user.click(submitButton());
	await user.type(emailInput(), "{Enter}");
	const form = nameInput().closest("form");
	if (form) fireEvent.submit(form);
	expect(submit).toHaveBeenCalledTimes(1);
	expect(submit.mock.calls[0]?.[0]).toEqual({
		name: "Sample dashboard",
		email: "sam@example.com",
		team: "research",
		details: "A sample project for trying the form.",
		confirm: true,
	});
	expect(nameInput()).toHaveValue("  Sample dashboard  ");

	finish();
	expect(
		await screen.findByText("Saved REQ-042: “Sample dashboard” for research."),
	).toBeInTheDocument();
	expect(nameInput()).toHaveValue("");
	expect(confirmBox()).not.toBeChecked();
	expect(nameInput()).not.toHaveAttribute("aria-invalid");
});

it("keeps answers after a server failure and succeeds on retry", async () => {
	const { user } = renderForm("/examples/form?scenario=error");
	await fillValidForm(user);
	await user.click(submitButton());

	const alert = await screen.findByRole("alert");
	expect(
		within(alert).getByText("The demo server is unavailable."),
	).toBeInTheDocument();
	expect(nameInput()).toHaveValue("  Sample dashboard  ");

	await user.click(screen.getByRole("link", { name: "Working server" }));
	await user.click(submitButton());
	expect(
		await screen.findByText("Saved REQ-042: “Sample dashboard” for research."),
	).toBeInTheDocument();
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	expect(submit).toHaveBeenCalledTimes(2);
});

it("resets values, errors, and a failed submission", async () => {
	const { user } = renderForm("/examples/form?scenario=error");
	await fillValidForm(user);
	await user.click(submitButton());
	await screen.findByRole("alert");
	await user.clear(emailInput());
	await user.tab();
	expect(emailInput()).toHaveAttribute("aria-invalid", "true");

	await user.click(screen.getByRole("button", { name: "Reset" }));
	expect(nameInput()).toHaveValue("");
	expect(emailInput()).not.toHaveAttribute("aria-invalid");
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
